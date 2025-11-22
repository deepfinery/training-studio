import { ObjectId } from 'mongodb';
import { getCollection } from '../config/database';
import { EvaluationRecord } from '../types/evaluation';

type EvaluationInput = Omit<EvaluationRecord, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;

function normalize(doc: (EvaluationRecord & { _id?: ObjectId }) | null): EvaluationRecord | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: rest.id ?? _id?.toString() };
}

export async function recordEvaluation(userId: string, payload: EvaluationInput) {
  const now = new Date().toISOString();
  const collection = await getCollection<EvaluationRecord>('evaluations');
  const result = await collection.insertOne({
    userId,
    ...payload,
    createdAt: now,
    updatedAt: now
  });

  const doc = await collection.findOne({ _id: result.insertedId });
  return normalize(doc);
}

export async function listEvaluations(userId: string) {
  const collection = await getCollection<EvaluationRecord>('evaluations');
  const docs = await collection.find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
  return docs.map(doc => normalize(doc)!);
}
