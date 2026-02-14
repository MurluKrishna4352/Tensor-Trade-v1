import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface ChartProps {
  // Future: Accept data prop to update chart dynamically via injectedJavaScript
}

const Chart: React.FC<ChartProps> = () => {
  const chartHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://unpkg.com/lightweight-charts@4.1.1/dist/lightweight-charts.standalone.production.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #ffffff; }
          #chart { width: 100vw; height: 100vh; }
        </style>
      </head>
      <body>
        <div id="chart"></div>
        <script>
          const container = document.getElementById('chart');
          const chart = LightweightCharts.createChart(container, {
            layout: { backgroundColor: '#ffffff', textColor: '#000000' },
            grid: { vertLines: { color: '#e0e0e0' }, horzLines: { color: '#e0e0e0' } },
            timeScale: { borderColor: '#000000' },
            rightPriceScale: { borderColor: '#000000' },
          });

          const series = chart.addCandlestickSeries({
            upColor: '#ffffff',
            downColor: '#ff0000',
            borderVisible: true,
            borderColor: '#000000',
            wickUpColor: '#000000',
            wickDownColor: '#ff0000',
          });

          const data = [];
          let price = 100;
          const now = new Date();
          for (let i = 0; i < 100; i++) {
            const time = new Date(now.getTime() - (100 - i) * 86400000);
            const open = price;
            const close = price + (Math.random() - 0.5) * 5;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            data.push({
              time: time.toISOString().split('T')[0],
              open: open, high: high, low: low, close: close
            });
            price = close;
          }
          series.setData(data);

          window.addEventListener('resize', () => {
            chart.applyOptions({ width: window.innerWidth, height: window.innerHeight });
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: chartHtml }}
        style={{ flex: 1 }}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderColor: '#000',
    borderWidth: 1,
    marginVertical: 10,
  },
});

export default Chart;
