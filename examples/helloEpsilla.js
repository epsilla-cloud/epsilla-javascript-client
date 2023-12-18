const epsillajs = require('epsillajs');

async function helloEpsilla() {
  // Connect to Epsilla VectorDB
  const db = new epsillajs.EpsillaDB({ host: 'localhost', port: 8888 });

  const dbName = 'MyDB';
  const tableName = 'MyTable';

  // Load DB with path
  const load = await db.load('/data/epsilla_demo', dbName);
  console.log(load);

  // Set DB to current DB
  db.useDB(dbName);

  // Create a table with schema in current DB
  const createTable = await db.createTable(tableName, [
    {
      name: 'ID',
      dataType: 'INT',
      primaryKey: true
    },
    {
      name: 'Doc',
      dataType: 'STRING'
    },
    {
      name: 'Embedding',
      dataType: 'VECTOR_FLOAT',
      dimensions: 4,
      metricType: 'COSINE'
    }
  ]);
  console.log(createTable);

  // Get a list of table names in current DB
  const listTables = await db.listTables();
  console.log(listTables);

  // Insert new vector records into table
  const insert = await db.insert(tableName, [
    {
      ID: 1,
      Doc: 'Berlin',
      Embedding: [0.05, 0.61, 0.76, 0.74]
    },
    {
      ID: 2,
      Doc: 'London',
      Embedding: [0.19, 0.81, 0.75, 0.11]
    },
    {
      ID: 3,
      Doc: 'Moscow',
      Embedding: [0.36, 0.55, 0.47, 0.94]
    },
    {
      ID: 4,
      Doc: 'San Francisco',
      Embedding: [0.18, 0.01, 0.85, 0.80]
    },
    {
      ID: 5,
      Doc: 'Shanghai',
      Embedding: [0.24, 0.18, 0.22, 0.44]
    }
  ]);
  console.log(insert);

  // Query Vectors with specific response field
  const queryWithField = await db.query(tableName, {
    queryField: 'Embedding',
    queryVector: [0.35, 0.55, 0.47, 0.94],
    response: 'Doc',
    limit: 2
  });
  console.log(queryWithField);

  // Query Vectors without specific response field, then it will return all fields
  const query = await db.query(tableName, {
    queryField: 'Embedding',
    queryVector: [0.35, 0.55, 0.47, 0.94],
    limit: 2
  });
  console.log(query);

  // Get Vectors
  const get = await db.get(tableName, {
    limit: 2
  });
  console.log(get);

  // Delete record with primary key
  const deleteWithPrimaryKey = await db.delete(tableName, {
    primaryKeys: [1]
  });
  console.log(deleteWithPrimaryKey);

  // Delete records with filter
  const deleteWithFilter = await db.delete(tableName, {
    filter: 'Doc = "London"'
  });
  console.log(deleteWithFilter);

  // Drop table
  // const dropTable = await db.dropTable(tableName);
  // console.log(dropTable);

  // Unload DB
  // const unload = await db.unload(dbName);
  // console.log(unload);
}

helloEpsilla();