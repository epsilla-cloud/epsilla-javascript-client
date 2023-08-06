# epsillaJS
A typescript/javascript library to connect Epsilla vector database

## 1. Installation
```shell
npm install epsillajs
```

## 2.Quick Start

### 2.1 Run epsilla vectordb on localhost
```shell
docker pull epsilla/vectordb
docker run -d -p 8888:8888 epsilla/vectordb
```

### 2.2 Use epsillaJS to connect to and interact with vector database

```javascript
const epsillajs = require('epsillajs');

// connect to vectordb
const db = new epsillajs.EpsillaDB();

// load and use a database
const db_path = 'tmp/epsilla';
const load = await db.loadDB(db_path, 'MyDB');
db.useDB("MyDB");

// create a table in the current database
await db.createTable('MyTable',
  [
    {"name": "ID", "dataType": "INT"},
    {"name": "Doc", "dataType": "STRING"},
    {"name": "Embedding", "dataType": "VECTOR_FLOAT", "dimensions": 4}
  ]
);

// insert records
await db.insert('MyTable',
  [
    {"ID": 1, "Doc": "Berlin", "Embedding": [0.05, 0.61, 0.76, 0.74]},
    {"ID": 2, "Doc": "London", "Embedding": [0.19, 0.81, 0.75, 0.11]},
    {"ID": 3, "Doc": "Moscow", "Embedding": [0.36, 0.55, 0.47, 0.94]},
    {"ID": 4, "Doc": "San Francisco", "Embedding": [0.18, 0.01, 0.85, 0.80]},
    {"ID": 5, "Doc": "Shanghai", "Embedding": [0.24, 0.18, 0.22, 0.44]}
  ]
);

// search
const query = await db.query(
  'MyTable',
  "Embedding", // query field
  [0.35, 0.55, 0.47, 0.94], // query vector
  5, // top k
  // response fields and with distance are optional
);

// drop a table
await db.dropTable('MyTable');

// unload a database from memory
await db.unloadDB('MyDB')
```
