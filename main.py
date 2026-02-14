from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, AsyncGenerator
import asyncio
import logging
import json
import os
from datetime import datetime, timedelta

# Import agents
from agents.behaviour_agent import BehaviorMonitorAgent
from agents.narrator import NarratorAgent
from agents.persona import PersonaAgent
from agents.moderator import ModeratorAgent
from agents.risk_manager import RiskManagerAgent
from agents.sentiment_agent import SentimentAnalysisAgent
from agents.compliance_agent import ComplianceAgent
from agents.shariah_compliance_agent import ShariahComplianceAgent
from agents.calling_agent import CallingAgent

# Import LLM Council
from llm_council.services.debate_engine import get_council_analysis, get_council_analysis_stream

# Import services
from services.economic_calendar import EconomicCalendarService
from services.trade_history import get_trade_history_service
from services.market_metrics import get_market_metrics_service
from services.asset_validator import validate_asset_symbol, AssetValidationError
from services.self_improvement import SelfImprovementService
from services.voice_service import (
    generate_speech,
    generate_speech_stream,
    make_twilio_call,
    build_market_update_script,
    get_voice_config_status,
    is_elevenlabs_configured,
    is_twilio_configured,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Multi-Agent Trading Psychology API")

# Simple in-memory cache
ANALYSIS_CACHE = {}
CACHE_TTL = timedelta(minutes=10)

# Initialize Self-Improvement Service
self_improvement_service = SelfImprovementService()

def get_cached_analysis(symbol: str) -> Optional[dict]:
    if symbol in ANALYSIS_CACHE:
        entry = ANALYSIS_CACHE[symbol]
        if datetime.utcnow() - entry['timestamp'] < CACHE_TTL:
            return entry['data']
        else:
            del ANALYSIS_CACHE[symbol]
    return None

def set_cached_analysis(symbol: str, data: dict):
    ANALYSIS_CACHE[symbol] = {
        'timestamp': datetime.utcnow(),
        'data': data
    }

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MarketWatcherAgent:
    """
    Market analysis using 5-agent LLM debate council.
    Provides diverse perspectives from macro, fundamental, flow, technical, and skeptic agents.
    """
    
    async def run_async(self, context: dict) -> dict:
        """Async version for LLM council integration."""
        try:
            # Extract asset symbol from market_event or context
            asset = context.get("asset", "AAPL")  # Default to AAPL if not specified
            
            # Validate asset symbol
            from services.asset_validator import validate_asset_symbol
            is_valid, error_msg = validate_asset_symbol(asset)
            if not is_valid:
                logger.error(f"Invalid asset symbol: {error_msg}")
                context["market_opinions"] = [f"Invalid asset symbol '{asset}': {error_msg}"]
                context["asset"] = asset
                context["price_change_pct"] = "0.0"
                return context
            
            asset = asset.strip().upper()
            context["asset"] = asset
            
            # Get economic calendar data
            try:
                economic_service = EconomicCalendarService()
                economic_data = economic_service.get_stock_events(asset)
                economic_summary = economic_service.get_market_summary(asset)
                
                # Add to context for downstream agents
                context["economic_calendar"] = economic_data
                context["economic_summary"] = economic_summary
                
                logger.info(f"Economic calendar: {economic_summary[:100]}...")
            except Exception as e:
                logger.warning(f"Could not fetch economic data: {e}")
                economic_summary = ""
            
            # Extract symbol if it's a derivative asset like "Boom 500"
            # For now, we'll use a mapping for synthetic indices
            symbol_mapping = {
                "Boom 500": "SPY",  # S&P 500 ETF as proxy
                "Boom 1000": "SPY",
                "Crash 500": "VIXY",  # Volatility ETF
                "Volatility 75": "VXX",
                "Step Index": "DIA",  # Dow Jones ETF
            }
            
            symbol = symbol_mapping.get(asset, asset)
            
            logger.info(f"Running LLM council analysis for {symbol}...")
            
            # Get 5-agent council debate with economic context
            debate_result = await get_council_analysis(symbol, economic_context=economic_summary)
            
            # Format market opinions from all 5 agents
            market_opinions = []
            for arg in debate_result["agent_arguments"]:
                opinion = f"{arg.agent_name} ({arg.confidence.value}): {arg.thesis}"
                market_opinions.append(opinion)
            
            # Add council results to context
            context["market_opinions"] = market_opinions
            context["council_debate"] = debate_result
            context["consensus_points"] = [cp.statement for cp in debate_result["consensus_points"]]
            context["disagreement_topics"] = [dp.topic for dp in debate_result["disagreement_points"]]
            context["judge_summary"] = debate_result["judge_summary"]
            
            # Extract market context
            mc = debate_result["market_context"]
            context["asset"] = symbol
            context["price_change_pct"] = f"{abs(mc['move_pct']):.2f}"
            context["move_direction"] = mc["move_direction"]
            context["current_price"] = mc["price"]
            context["volume"] = mc["volume"]
            
            logger.info(f"Council analysis complete: {len(market_opinions)} agents analyzed {symbol}")
            
        except Exception as e:
            logger.error(f"MarketWatcherAgent error: {e}")
            # Fallback to basic context
            context["market_opinions"] = [f"Error getting council analysis: {str(e)}"]
            context["asset"] = context.get("asset", "UNKNOWN")
            context["price_change_pct"] = "0.0"
        
        return context
    
    def run(self, context: dict) -> dict:
        """Sync wrapper for the async method."""
        return asyncio.run(self.run_async(context))


class Trade(BaseModel):
    timestamp: str
    symbol: str  
    action: str
    price: float
    pnl: float
    status: str


class RunAgentsRequest(BaseModel):
    market_event: str
    user_trades: List[Trade]
    persona_style: str = "professional"


class CallScheduleRequest(BaseModel):
    user_id: str
    phone_number: str
    first_call_at: str
    call_type: str = "daily_summary"
    frequency: str = "daily"
    asset: Optional[str] = None
    timezone: str = "UTC"


class OutboundCallRequest(BaseModel):
    user_id: str
    phone_number: str
    message: str
    call_type: str = "market_update"
    asset: Optional[str] = None


class InboundCallRequest(BaseModel):
    user_id: str
    phone_number: str
    transcript: str
    asset: Optional[str] = None


class LiveCallRequest(BaseModel):
    """Request to place a live voice call to the user's phone."""
    user_id: str = "default_user"
    phone_number: str  # User enters on screen
    asset: str = "AAPL"


class VoiceUpdateRequest(BaseModel):
    """Request to generate a voice audio update (for browser playback)."""
    user_id: str = "default_user"
    asset: str = "AAPL"


# ── In-memory audio cache for Twilio TwiML playback ─────────
_audio_cache: Dict[str, bytes] = {}

calling_service = CallingAgent()


@app.get("/analyze-asset-stream")
async def analyze_asset_stream(asset: str, user_id: Optional[str] = "default_user"):
    """
    Streaming endpoint for real-time analysis updates.
    Yields NDJSON (newline delimited JSON) events.
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        nonlocal asset
        # Check cache first
        cached = get_cached_analysis(asset.upper())
        if cached:
            yield json.dumps({"type": "status", "message": "Using cached analysis (fast path)..."}) + "\n"
            await asyncio.sleep(0.5) # Simulate slight delay for UX
            yield json.dumps({"type": "complete", "data": cached}) + "\n"
            return

        yield json.dumps({"type": "status", "message": f"Validating symbol {asset}..."}) + "\n"

        # Validate asset
        is_valid, error_msg = validate_asset_symbol(asset)
        if not is_valid:
            yield json.dumps({"type": "error", "message": error_msg}) + "\n"
            return

        asset = asset.strip().upper()
        context = {"asset": asset, "user_id": user_id}

        try:
            # 1. Fetch Trade History
            yield json.dumps({"type": "status", "message": "Fetching trade history..."}) + "\n"
            trade_service = get_trade_history_service()
            trade_summary = trade_service.get_trading_summary(asset, user_id)
            user_trades = trade_summary["trades"]

            # Auto-select persona
            persona_style = trade_service.auto_select_persona(user_trades)
            context.update({
                "user_trades": user_trades,
                "trade_summary": trade_summary,
                "persona_style": persona_style
            })

            yield json.dumps({
                "type": "trade_history",
                "data": trade_summary,
                "persona": persona_style
            }) + "\n"

            # 2. Economic Calendar
            yield json.dumps({"type": "status", "message": "Scanning economic calendar..."}) + "\n"
            economic_service = EconomicCalendarService()
            economic_data = economic_service.get_stock_events(asset)
            economic_summary = economic_service.get_market_summary(asset)

            context.update({
                "economic_calendar": economic_data,
                "economic_summary": economic_summary
            })

            yield json.dumps({
                "type": "economic_data",
                "data": economic_data
            }) + "\n"

            # 3. Behavior Analysis
            yield json.dumps({"type": "status", "message": "Analyzing behavioral patterns..."}) + "\n"
            behavior_agent = BehaviorMonitorAgent()
            # Note: BehaviorMonitorAgent usually runs sync, but we can wrap it or just call it
            # The original code called it via run/run_async method of the agent instance
            # We'll re-use the agent interface if possible, or just call behavior agent methods
            # Let's assume standard agent interface:
            context = behavior_agent.run(context)

            yield json.dumps({
                "type": "behavior_analysis",
                "data": {
                    "flags": context.get("behavior_flags", []),
                    "insights": context.get("insights", [])
                }
            }) + "\n"

            # 4. LLM Council Debate (Streaming)
            yield json.dumps({"type": "status", "message": "Convening 5-agent LLM Council..."}) + "\n"

            council_debate_result = None
            market_opinions = []

            # Stream the debate
            async for chunk in get_council_analysis_stream(asset, economic_summary):
                if chunk["type"] == "debate_complete":
                    council_debate_result = chunk["data"]
                    # Extract opinions for next agents
                    for arg in council_debate_result["agent_arguments"]:
                        # Handle both dict and object
                        if isinstance(arg, dict):
                            opinion = f"{arg['agent_name']} ({arg['confidence']}): {arg['thesis']}"
                        else:
                            opinion = f"{arg.agent_name} ({arg.confidence.value}): {arg.thesis}"
                        market_opinions.append(opinion)

                # Forward the chunk to the client
                yield json.dumps(chunk) + "\n"

            if not council_debate_result:
                yield json.dumps({"type": "error", "message": "Council debate failed to return results"}) + "\n"
                return

            context["market_opinions"] = market_opinions
            context["council_debate"] = council_debate_result
            context["consensus_points"] = [cp['statement'] if isinstance(cp, dict) else cp.statement for cp in council_debate_result["consensus_points"]]
            context["disagreement_topics"] = [dp['topic'] if isinstance(dp, dict) else dp.topic for dp in council_debate_result["disagreement_points"]]
            context["judge_summary"] = council_debate_result["judge_summary"]

            mc = council_debate_result["market_context"]
            context["price_change_pct"] = f"{abs(mc['move_pct']):.2f}"
            context["move_direction"] = mc["move_direction"]
            context["current_price"] = mc["price"]
            context["volume"] = mc["volume"]

            # 5. Risk, Sentiment, Narrator, Persona, Moderator, Compliance
            yield json.dumps({"type": "status", "message": "Running advanced agents (Risk, Sentiment)..."}) + "\n"

            agent_flow = [
                ("SentimentAnalysisAgent", SentimentAnalysisAgent, True),
                ("RiskManagerAgent", RiskManagerAgent, True),
                ("ShariahComplianceAgent", ShariahComplianceAgent, True),
                ("NarratorAgent", NarratorAgent, False),
                ("PersonaAgent", PersonaAgent, False),
                ("ModeratorAgent", ModeratorAgent, False),
                ("ComplianceAgent", ComplianceAgent, True),
                ("CallingAgent", CallingAgent, True)
            ]

            for agent_name, agent_cls, is_async in agent_flow:
                try:
                    agent = agent_cls()
                    if is_async:
                        context = await agent.run_async(context)
                    else:
                        context = agent.run(context)
                except Exception as e:
                    logger.error(f"{agent_name} failed: {e}")

            # Record run for self-improvement
            try:
                # Extract agent outputs from debate result
                agent_outputs = {}
                if "council_debate" in context and "agent_arguments" in context["council_debate"]:
                    for arg in context["council_debate"]["agent_arguments"]:
                        # arg might be dict or object
                        name = arg.get("agent_name") if isinstance(arg, dict) else arg.agent_name
                        thesis = arg.get("thesis") if isinstance(arg, dict) else arg.thesis
                        agent_outputs[name] = thesis

                moderation = context.get("moderation", {})
                # Use X platform verdict as primary for now
                verdict = moderation.get("x", {})

                self_improvement_service.record_run(
                    asset=asset,
                    agent_outputs=agent_outputs,
                    moderator_verdict=verdict
                )
                yield json.dumps({"type": "status", "message": "Self-improvement cycle complete..."}) + "\n"
            except Exception as e:
                logger.error(f"Failed to record run: {e}")

            # 6. Calculate Metrics
            metrics_service = get_market_metrics_service()
            market_metrics = metrics_service.get_all_metrics(
                symbol=asset,
                agent_data={
                    "consensus_points": context.get("consensus_points", []),
                    "disagreement_topics": context.get("disagreement_topics", []),
                    "council_opinions": context.get("market_opinions", [])
                }
            )

            # 7. Final Response Construction
            final_response = {
                "asset": asset,
                "user_id": user_id,
                "analysis_type": "automated",
                "persona_selected": persona_style,
                "market_metrics": {
                    "vix": market_metrics["vix"],
                    "market_regime": market_metrics["market_regime"],
                    "risk_index": market_metrics["risk_index"],
                    "asset_volatility": market_metrics["asset_volatility"],
                    "risk_level": metrics_service.get_risk_level_description(market_metrics["risk_index"]),
                    "regime_color": metrics_service.get_regime_color(market_metrics["market_regime"])
                },
                "trade_history": {
                    "total_trades": trade_summary["total_trades"],
                    "total_pnl": trade_summary["total_pnl"],
                    "win_rate": trade_summary["win_rate"],
                    "last_trade": trade_summary.get("last_trade")
                },
                "economic_calendar": {
                    "earnings": economic_data.get("earnings_calendar", {}),
                    "recent_news": economic_data.get("recent_news", [])[:3],
                    "economic_events": economic_data.get("economic_events", []),
                    "summary": economic_summary
                },
                "behavioral_analysis": {
                    "flags": context.get("behavior_flags", []),
                    "insights": context.get("insights", [])
                },
                "market_analysis": {
                    "council_opinions": context.get("market_opinions", []),
                    "consensus": context.get("consensus_points", []),
                    "disagreements": context.get("disagreement_topics", []),
                    "judge_summary": context.get("judge_summary", ""),
                    "market_context": context["council_debate"]["market_context"]
                },
                "narrative": {
                    "summary": context.get("summary", ""),
                    "styled_message": context.get("final_message", ""),
                    "moderated_output": context.get("moderated_output", "")
                },
                "persona_post": context.get("persona_post", {"x": "", "linkedin": ""}),
                "risk_analysis": context.get("risk_analysis", {}),
                "sentiment_analysis": context.get("sentiment_analysis", {}),
                "compliance_analysis": context.get("compliance_analysis", {}),
                "shariah_compliance": context.get("shariah_compliance", {}),
                "timestamp": datetime.utcnow().isoformat()
            }

            # Cache the result
            set_cached_analysis(asset, final_response)

            yield json.dumps({"type": "complete", "data": final_response}) + "\n"

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield json.dumps({"type": "error", "message": str(e)}) + "\n"

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")


@app.post("/analyze-asset")
async def analyze_asset(asset: str, user_id: Optional[str] = "default_user"):
    """
    Simplified endpoint - only requires asset symbol.
    Automatically fetches trade history, economic calendar, and runs all agents.
    
    Args:
        asset: Stock symbol (e.g., "SPY", "AAPL", "TSLA")
        user_id: Optional user identifier for database lookup
        
    Returns:
        Complete multi-agent analysis with economic calendar impacts
    """
    # Validate asset symbol first
    is_valid, error_msg = validate_asset_symbol(asset)
    if not is_valid:
        logger.warning(f"Invalid asset symbol rejected: {asset} - {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Normalize symbol to uppercase
    asset = asset.strip().upper()
    logger.info(f"Starting automated analysis for {asset} (user: {user_id})")
    
    try:
        # 1. Fetch trade history from database (currently synthetic)
        trade_service = get_trade_history_service()
        trade_summary = trade_service.get_trading_summary(asset, user_id)
        user_trades = trade_summary["trades"]
        
        logger.info(f"Found {len(user_trades)} trades for {asset}")
        
        # 2. Get economic calendar and news
        economic_service = EconomicCalendarService()
        economic_data = economic_service.get_stock_events(asset)
        economic_summary = economic_service.get_market_summary(asset)
        
        logger.info(f"Economic events: {economic_summary[:100]}...")
        
        # 3. Auto-select persona based on trading performance
        persona_style = trade_service.auto_select_persona(user_trades)
        logger.info(f"Auto-selected persona: {persona_style}")
        
        # 4. Generate market event description
        market_event = f"{asset} analysis requested with economic calendar integration"
        
        # 5. Build context for agent pipeline
        context = {
            "market_event": market_event,
            "user_trades": user_trades,
            "persona_style": persona_style,
            "asset": asset,
            "user_id": user_id,
            "trade_summary": trade_summary,
            "economic_calendar": economic_data,
            "economic_summary": economic_summary,
            "auto_generated": True
        }
        
        # 6. Run agent pipeline
        agent_flow = [
            ("BehaviorMonitorAgent", BehaviorMonitorAgent, False),
            ("MarketWatcherAgent", MarketWatcherAgent, True),
            ("SentimentAnalysisAgent", SentimentAnalysisAgent, True),
            ("RiskManagerAgent", RiskManagerAgent, True),
            ("ShariahComplianceAgent", ShariahComplianceAgent, True),
            ("NarratorAgent", NarratorAgent, False),
            ("PersonaAgent", PersonaAgent, False),
            ("ModeratorAgent", ModeratorAgent, False),
            ("ComplianceAgent", ComplianceAgent, True),
            ("CallingAgent", CallingAgent, True)
        ]
        
        for agent_name, agent_cls, is_async in agent_flow:
            try:
                logger.info(f"Running {agent_name}...")
                agent = agent_cls ()
                
                if is_async:
                    context = await agent.run_async(context)
                else:
                    context = agent.run(context)
                    
                logger.info(f"✓ {agent_name} completed")
                
            except Exception as e:
                logger.error(f"✗ {agent_name} failed: {e}")
                context[f"{agent_name}_error"] = str(e)

        # Record run for self-improvement
        try:
            # Extract agent outputs from debate result
            agent_outputs = {}
            if "council_debate" in context and "agent_arguments" in context["council_debate"]:
                for arg in context["council_debate"]["agent_arguments"]:
                    # arg might be dict or object
                    name = arg.get("agent_name") if isinstance(arg, dict) else arg.agent_name
                    thesis = arg.get("thesis") if isinstance(arg, dict) else arg.thesis
                    agent_outputs[name] = thesis

            moderation = context.get("moderation", {})
            # Use X platform verdict as primary for now
            verdict = moderation.get("x", {})

            self_improvement_service.record_run(
                asset=asset,
                agent_outputs=agent_outputs,
                moderator_verdict=verdict
            )
        except Exception as e:
            logger.error(f"Failed to record run: {e}")
        
        # 7. Calculate market metrics (VIX, regime, risk index)
        metrics_service = get_market_metrics_service()
        market_metrics = metrics_service.get_all_metrics(
            symbol=asset,
            agent_data={
                "consensus_points": context.get("consensus_points", []),
                "disagreement_topics": context.get("disagreement_topics", []),
                "council_opinions": context.get("market_opinions", [])
            }
        )
        
        logger.info(f"Market metrics: VIX={market_metrics['vix']}, Regime={market_metrics['market_regime']}, Risk Index={market_metrics['risk_index']}")
        
        # 8. Format response
        response = {
            "asset": asset,
            "user_id": user_id,
            "analysis_type": "automated",
            "persona_selected": persona_style,
            
            # Market metrics (VIX, regime, risk index)
            "market_metrics": {
                "vix": market_metrics["vix"],
                "market_regime": market_metrics["market_regime"],
                "risk_index": market_metrics["risk_index"],
                "asset_volatility": market_metrics["asset_volatility"],
                "risk_level": metrics_service.get_risk_level_description(market_metrics["risk_index"]),
                "regime_color": metrics_service.get_regime_color(market_metrics["market_regime"])
            },
            
            # Trade summary
            "trade_history": {
                "total_trades": trade_summary["total_trades"],
                "total_pnl": trade_summary["total_pnl"],
                "win_rate": trade_summary["win_rate"],
                "last_trade": trade_summary.get("last_trade")
            },
            
            # Economic calendar impacts
            "economic_calendar": {
                "earnings": economic_data.get("earnings_calendar", {}),
                "recent_news": economic_data.get("recent_news", [])[:3],
                "economic_events": economic_data.get("economic_events", []),
                "summary": economic_summary
            },
            
            # Agent outputs
            "behavioral_analysis": {
                "flags": context.get("behavior_flags", []),
                "insights": context.get("insights", [])
            },
            
            "market_analysis": {
                "council_opinions": context.get("market_opinions", []),
                "consensus": context.get("consensus_points", []),
                "disagreements": context.get("disagreement_topics", []),
                "judge_summary": context.get("judge_summary", ""),
                "market_context": {
                    "price": context.get("current_price"),
                    "move_direction": context.get("move_direction"),
                    "change_pct": context.get("price_change_pct"),
                    "volume": context.get("volume")
                }
            },
            
            "narrative": {
                "summary": context.get("summary", ""),
                "styled_message": context.get("final_message", ""),
                "moderated_output": context.get("moderated_output", "")
            },
            
            "persona_post": context.get("persona_post", {"x": "", "linkedin": ""}),
            
            "risk_analysis": context.get("risk_analysis", {}),
            "sentiment_analysis": context.get("sentiment_analysis", {}),
            "compliance_analysis": context.get("compliance_analysis", {}),
            "shariah_compliance": context.get("shariah_compliance", {}),

            # Metadata
            "timestamp": economic_data.get("timestamp"),
            "errors": {k: v for k, v in context.items() if k.endswith("_error")}
        }
        
        logger.info(f"Analysis complete for {asset}")
        return response
        
    except ValueError as e:
        # Handle configuration errors (like missing API keys)
        error_msg = str(e)
        logger.error(f"Configuration error for {asset}: {error_msg}")
        
        if "API key" in error_msg or "LLM" in error_msg:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "LLM services unavailable",
                    "message": "The analysis system requires LLM API keys to function. Please contact the administrator.",
                    "technical_details": error_msg
                }
            )
        raise HTTPException(status_code=400, detail=error_msg)
        
    except Exception as e:
        logger.error(f"Analysis failed for {asset}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/run-agents")
async def run_agents(request: RunAgentsRequest):
    """
    LEGACY: Run the full multi-agent pipeline with custom inputs.
    For simplified usage, use /analyze-asset endpoint instead.
    
    Pipeline:
        1. BehaviorMonitorAgent - Detects trading psychology patterns
        2. MarketWatcherAgent - 5 LLM debate council (macro, fundamental, flow, technical, skeptic)
        3. NarratorAgent - Generates AI-powered session summary
        4. PersonaAgent - Applies personality styling
        5. ModeratorAgent - Final moderation and safety
    """
    
    logger.info(f"Starting agent pipeline for {request.market_event}")
    
    # Convert request to context dictionary
    context = {
        "market_event": request.market_event,
        "user_trades": [trade.model_dump() for trade in request.user_trades],
        "persona_style": request.persona_style
    }
    
    # Running agents in sequence
    agent_flow = [
        ("BehaviorMonitorAgent", BehaviorMonitorAgent, False),
        ("MarketWatcherAgent", MarketWatcherAgent, True),
        ("NarratorAgent", NarratorAgent, False),
        ("PersonaAgent", PersonaAgent, False),
        ("ModeratorAgent", ModeratorAgent, False)
    ]
    
    for agent_name, agent_cls, is_async in agent_flow:
        try:
            logger.info(f"Running {agent_name}...")
            agent = agent_cls()
            
            if is_async:
                context = await agent.run_async(context)
            else:
                context = agent.run(context)
                
            logger.info(f"✓ {agent_name} completed")
            
        except Exception as e:
            logger.error(f"✗ {agent_name} failed: {e}")
            context[f"{agent_name}_error"] = str(e)
    
    return {
        "message": "Multi-agent pipeline completed",
        "result": context,
        "agents_run": len(agent_flow)
    }


@app.get("/api")
def root():
    """Root API endpoint with API info."""
    return {
        "message": "Multi-Agent Trading Psychology API",
        "version": "2.0.0",
        "endpoints": {
            "/analyze-asset": "🚀 NEW - Simplified analysis (asset only)",
            "/run-agents": "Full agent pipeline (custom inputs)",
            "/health": "Health check",
            "/calls/schedule": "Create scheduled outbound call",
            "/calls/inbound": "Handle user-initiated inbound call",
            "/calls/outbound": "Trigger immediate outbound call",
            "/docs": "API documentation"
        },
        "agents": {
            "BehaviorMonitorAgent": "Detects 10 behavioral trading patterns",
            "MarketWatcherAgent": "5 LLM debate council (Macro, Fundamental, Flow, Technical, Skeptic)",
            "SentimentAnalysisAgent": "Analyzes market sentiment from news",
            "RiskManagerAgent": "Calculates VaR, Max Drawdown, and qualitative risk",
            "NarratorAgent": "AI-powered session summaries with trends",
            "PersonaAgent": "Personality styling",
            "ModeratorAgent": "Final moderation",
            "ComplianceAgent": "Checks for regulatory flags (SEC/FINRA)",
            "ShariahComplianceAgent": "Evaluates assets for Shariah compliance",
            "CallingAgent": "Two-way calling + scheduling for market updates"
        },
        "features": {
            "economic_calendar": "Automated earnings and economic event tracking",
            "trade_history": "Automatic trade history fetching (DB integration ready)",
            "auto_persona": "Intelligent persona selection based on performance"
        }
    }




@app.post("/calls/schedule")
def schedule_market_call(request: CallScheduleRequest):
    """Schedule recurring or one-time outbound calls with market updates."""
    first_call_at = datetime.fromisoformat(request.first_call_at)
    schedule = calling_service.schedule_call(
        user_id=request.user_id,
        phone_number=request.phone_number,
        first_call_at=first_call_at,
        call_type=request.call_type,
        frequency=request.frequency,
        asset=request.asset,
        timezone=request.timezone,
    )
    return {"message": "Call schedule created", "schedule": schedule}


@app.get("/calls/schedule/{user_id}")
def list_call_schedules(user_id: str):
    """List active call schedules for a user."""
    return {"user_id": user_id, "schedules": calling_service.list_schedules(user_id)}


@app.delete("/calls/schedule/{user_id}/{schedule_id}")
def cancel_call_schedule(user_id: str, schedule_id: str):
    """Cancel an existing call schedule."""
    result = calling_service.cancel_schedule(schedule_id, user_id)
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/calls/outbound")
def trigger_outbound_call(request: OutboundCallRequest):
    """Trigger an immediate outbound call from the agent to the user."""
    log = calling_service.trigger_outbound_call(
        user_id=request.user_id,
        phone_number=request.phone_number,
        message=request.message,
        call_type=request.call_type,
        asset=request.asset,
    )
    return {"message": "Outbound call executed", "call": log}


@app.post("/calls/inbound")
def handle_inbound_call(request: InboundCallRequest):
    """Handle a user initiated inbound call into the agent."""
    log = calling_service.handle_inbound_call(
        user_id=request.user_id,
        phone_number=request.phone_number,
        transcript=request.transcript,
        asset=request.asset,
    )
    return {"message": "Inbound call handled", "call": log}


@app.post("/calls/process-due")
def process_due_calls(now_iso: Optional[str] = None):
    """Process due schedules (intended for cron/background execution)."""
    now = datetime.fromisoformat(now_iso) if now_iso else datetime.utcnow()
    executed = calling_service.process_due_calls(now=now)
    return {"processed": len(executed), "calls": executed}


@app.get("/calls/logs/{user_id}")
def get_call_logs(user_id: str):
    """Retrieve inbound/outbound call history for a user."""
    return {"user_id": user_id, "logs": calling_service.get_call_logs(user_id)}


@app.get("/self-improvement/metrics")
def get_improvement_metrics():
    """Get self-improvement metrics."""
    return self_improvement_service.analyze_performance()


# ═══════════════════════════════════════════════════════════════
#  LIVE VOICE CALL ENDPOINTS  (ElevenLabs TTS + Twilio)
# ═══════════════════════════════════════════════════════════════

@app.get("/voice/config")
def voice_config():
    """Return which voice services are configured."""
    return get_voice_config_status()


@app.post("/voice/generate-audio")
async def voice_generate_audio(request: VoiceUpdateRequest):
    """
    Generate a spoken market update for browser playback.
    1. Run quick analysis on the asset
    2. Build a spoken script
    3. Convert to audio via ElevenLabs
    Returns MP3 audio bytes.
    """
    asset = request.asset.upper().strip()
    logger.info(f"Voice audio request for {asset}")

    # Quick analysis context (reuse cache if available)
    context = await _get_analysis_context(asset, request.user_id)
    script = build_market_update_script(context)
    logger.info(f"Voice script ({len(script)} chars): {script[:120]}…")

    if not is_elevenlabs_configured():
        # Return the script as JSON so the frontend can use browser TTS
        return {
            "mode": "browser_tts",
            "script": script,
            "message": "ElevenLabs not configured – use browser speech synthesis",
        }

    audio_bytes = await generate_speech(script)
    if audio_bytes is None:
        return {
            "mode": "browser_tts",
            "script": script,
            "message": "ElevenLabs TTS failed – falling back to browser speech",
        }

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="{asset}_update.mp3"',
            "X-Voice-Script": script[:200],
        },
    )


@app.post("/voice/generate-audio-stream")
async def voice_generate_audio_stream(request: VoiceUpdateRequest):
    """
    Stream spoken market update audio chunks for real-time playback.
    """
    asset = request.asset.upper().strip()
    context = await _get_analysis_context(asset, request.user_id)
    script = build_market_update_script(context)

    if not is_elevenlabs_configured():
        raise HTTPException(status_code=503, detail="ElevenLabs not configured")

    async def audio_stream():
        async for chunk in generate_speech_stream(script):
            yield chunk

    return StreamingResponse(
        audio_stream(),
        media_type="audio/mpeg",
        headers={"X-Voice-Script": script[:200]},
    )


@app.post("/voice/live-call")
async def voice_live_call(request: LiveCallRequest):
    """
    Place a real phone call to the user and speak a market update.
    Flow:
    1. Generate analysis for the asset
    2. Build spoken script
    3. Convert to audio via ElevenLabs
    4. Store audio temporarily
    5. Call user's phone via Twilio, pointing to our TwiML endpoint
    """
    asset = request.asset.upper().strip()
    phone = request.phone_number.strip()
    logger.info(f"Live call request: {phone} for {asset}")

    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required")

    # Generate analysis + script
    context = await _get_analysis_context(asset, request.user_id)
    script = build_market_update_script(context)

    # Generate audio
    audio_bytes = None
    if is_elevenlabs_configured():
        audio_bytes = await generate_speech(script)

    if not is_twilio_configured():
        # No Twilio → return script + audio for browser playback
        result = {
            "success": True,
            "mode": "browser",
            "message": "Twilio not configured – playing update in browser instead",
            "script": script,
            "has_audio": audio_bytes is not None,
        }
        if audio_bytes:
            import base64
            result["audio_base64"] = base64.b64encode(audio_bytes).decode()
        return result

    # Store audio for Twilio webhook
    call_id = f"{request.user_id}_{asset}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    if audio_bytes:
        _audio_cache[call_id] = audio_bytes

    # Build the TwiML URL  (Twilio will fetch this when the call connects)
    # In production, use your public domain. For dev, use ngrok or similar.
    base_url = os.getenv("BASE_URL", "http://localhost:8000")
    twiml_url = f"{base_url}/voice/twiml/{call_id}"

    # Place the call
    call_result = make_twilio_call(
        to_number=phone,
        twiml_url=twiml_url,
    )

    if not call_result["success"]:
        # Twilio failed – fall back to browser
        result = {
            "success": True,
            "mode": "browser_fallback",
            "message": f"Phone call failed ({call_result['error']}) – playing in browser",
            "script": script,
            "has_audio": audio_bytes is not None,
        }
        if audio_bytes:
            import base64
            result["audio_base64"] = base64.b64encode(audio_bytes).decode()
        return result

    # Log the call
    calling_service.trigger_outbound_call(
        user_id=request.user_id,
        phone_number=phone,
        message=script[:200],
        call_type="live_voice_call",
        asset=asset,
    )

    return {
        "success": True,
        "mode": "phone_call",
        "message": f"Calling {phone} now with your {asset} market update!",
        "call_sid": call_result.get("call_sid"),
        "script": script,
    }


@app.get("/voice/twiml/{call_id}")
async def voice_twiml(call_id: str):
    """
    Serves TwiML to Twilio when the call connects.
    If we have cached audio, play it. Otherwise use Twilio's <Say>.
    """
    from xml.etree.ElementTree import Element, SubElement, tostring

    response_el = Element("Response")

    if call_id in _audio_cache:
        # Serve audio via a Play tag pointing to our audio endpoint
        base_url = os.getenv("BASE_URL", "http://localhost:8000")
        play_el = SubElement(response_el, "Play")
        play_el.text = f"{base_url}/voice/audio/{call_id}"
    else:
        # Fallback: use Twilio's built-in TTS
        say_el = SubElement(response_el, "Say", voice="Polly.Matthew")
        say_el.text = "Hello, this is TensorTrade. We could not generate the audio update. Please check the app for your market analysis. Goodbye."

    twiml_xml = tostring(response_el, encoding="unicode")
    return Response(content=twiml_xml, media_type="application/xml")


@app.get("/voice/audio/{call_id}")
async def voice_audio(call_id: str):
    """Serve cached ElevenLabs audio to Twilio during a call."""
    if call_id not in _audio_cache:
        raise HTTPException(status_code=404, detail="Audio not found")

    audio = _audio_cache.pop(call_id)  # Serve once, then clean up
    return Response(content=audio, media_type="audio/mpeg")


async def _get_analysis_context(asset: str, user_id: str = "default_user") -> dict:
    """
    Helper to get analysis context for voice scripts.
    Uses cache if available, otherwise runs a quick analysis.
    """
    import os

    cached = get_cached_analysis(asset)
    if cached:
        return cached

    # Run minimal analysis for voice update
    context = {"asset": asset, "user_id": user_id}

    try:
        # Market metrics
        metrics_service = get_market_metrics_service()
        market_metrics = metrics_service.get_comprehensive_metrics(asset)
        context["market_metrics"] = {
            "risk_index": market_metrics.get("risk_index"),
            "risk_level": metrics_service.get_risk_level_description(market_metrics.get("risk_index", 50)),
            "market_regime": market_metrics.get("market_regime"),
            "vix": market_metrics.get("vix"),
        }
        context["current_price"] = market_metrics.get("current_price")
        context["price_change_pct"] = market_metrics.get("price_change_pct")
        context["move_direction"] = market_metrics.get("move_direction")
    except Exception as e:
        logger.warning(f"Voice context – market metrics failed: {e}")

    try:
        # Quick council analysis (non-streaming)
        council_result = await get_council_analysis(asset)
        context["market_analysis"] = {
            "council_opinions": council_result.get("opinions", []),
            "consensus": council_result.get("consensus", []),
            "market_context": council_result.get("market_context", {}),
        }
    except Exception as e:
        logger.warning(f"Voice context – council analysis failed: {e}")

    try:
        # Risk
        risk_agent = RiskManagerAgent()
        context = risk_agent.run(context)
    except Exception as e:
        logger.warning(f"Voice context – risk agent failed: {e}")

    try:
        # Narrator
        narrator = NarratorAgent()
        context = narrator.run(context)
    except Exception as e:
        logger.warning(f"Voice context – narrator failed: {e}")

    return context


@app.get("/health")
def health_check():
    """Health check endpoint with environment diagnostics."""
    import os
    
    # Check API keys
    api_keys_status = {
        "groq": "✓" if os.getenv("GROQ_API_KEY") else "✗",
        "openrouter": "✓" if os.getenv("OPENROUTER_API_KEY") else "✗",
        "mistral": "✓" if os.getenv("MISTRAL_API_KEY") else "✗",
        "gemini": "✓" if os.getenv("GEMINI_API_KEY") else "✗"
    }
    
    # Check if at least one key is available
    has_llm_access = any(val == "✓" for val in api_keys_status.values())
    
    return {
        "status": "healthy" if has_llm_access else "degraded",
        "version": "2.0.0",
        "environment": {
            "api_keys": api_keys_status,
            "llm_available": has_llm_access,
            "warning": "Missing API keys - LLM features unavailable" if not has_llm_access else None
        },
        "services": {
            "behavior_monitor": "operational",
            "market_watcher": "operational (5 LLM council)" if has_llm_access else "degraded - no API keys",
            "narrator": "operational" if has_llm_access else "degraded - no API keys",
            "persona": "operational" if has_llm_access else "degraded - no API keys",
            "moderator": "operational",
            "economic_calendar": "operational",
            "trade_history": "operational (synthetic)",
            "voice_elevenlabs": "operational" if is_elevenlabs_configured() else "not configured",
            "voice_twilio": "operational" if is_twilio_configured() else "not configured",
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
