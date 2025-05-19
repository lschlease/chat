import React from 'react';
import ReactECharts from 'echarts-for-react';

const SpiderChart = ({ data }) => (
  <ReactECharts
    option={{
      radar: {
        indicator: data.map(item => ({
          name: item.name,
          max: 100
        }))
      },
      series: [{
        type: 'radar',
        data: [{
          value: data.map(item => item.value),
          name: '能力评估'
        }]
      }]
    }}
    style={{ height: '300px' }}
  />
);

export default SpiderChart; 