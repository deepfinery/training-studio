import { Db, Document, MongoClient, Collection } from 'mongodb';
import { env } from './env';

let client: MongoClient | null = null;
let database: Db | null = null;

export async function initDb(): Promise<Db> {
  if (database) return database;

  const useTls = env.DOCUMENTDB_URI.includes('docdb') || env.DOCUMENTDB_URI.includes('amazonaws.com');
  const clientOptions = {
    retryWrites: false,
    tls: useTls,
    tlsCAFile: env.DOCUMENTDB_TLS_CA_FILE || undefined
  };

  client = new MongoClient(env.DOCUMENTDB_URI, clientOptions);
  database = client.db(env.DOCUMENTDB_DB);

  await database.command({ ping: 1 });
  return database;
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db = await initDb();
  return db.collection<T>(name);
}
