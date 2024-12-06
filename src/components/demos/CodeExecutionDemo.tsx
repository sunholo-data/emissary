import React from 'react';
import { Pre } from '@/components/markdown/Pre';

const CodeExecutionDemo = () => {
  const pythonCode = `>>> import pandas as pd
>>> import numpy as np
>>> import matplotlib.pyplot as plt

# Generate sample data
>>> np.random.seed(42)
>>> data = {
...     'value': np.random.normal(100, 15, 1000),
...     'category': np.random.choice(['A', 'B', 'C'], 1000)
... }
>>> df = pd.DataFrame(data)

# Basic statistics
>>> df.describe()
             value
count  1000.00000
mean    100.18934
std      14.99819
min      56.52457
25%      89.47858
50%     100.08238
75%     110.67431
max     144.96611

# Group by analysis
>>> df.groupby('category')['value'].mean()
category
A    100.712340
B     99.023458
C    100.831922
Name: value, dtype: float64

# Additional calculations
>>> df['normalized'] = (df['value'] - df['value'].mean()) / df['value'].std()
>>> df.head()
       value category  normalized
0  99.791755        C   -0.026524
1  96.042831        A   -0.276432
2  94.371491        B   -0.388543
3  97.059916        A   -0.208654
4  95.909702        C   -0.285394`;

  return (
    <div className="space-y-4">
      <Pre className="bg-slate-950 text-white rounded-lg p-4 font-mono text-xs">
        <div className="flex items-center gap-2 mb-2 text-gray-400">
          <span>Python Code Execution</span>
        </div>
        <div className="whitespace-pre text-green-400">
          {pythonCode}
        </div>
      </Pre>
    </div>
  );
};

export default CodeExecutionDemo;