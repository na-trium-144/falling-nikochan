import { MongoClient } from "mongodb";

const lvHashBefore =
  "6beee9567260c38beabd9de95f442dd78948c2640d754325079836bb8ea5090e";
const lvHashAfter =
  "61222081455ff1c4dc3410bc2612e2071aff954d57644da3c36f07b050bfe1ef";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not set");
}

const client = new MongoClient(process.env.MONGODB_URI!);
try {
  await client.connect();
  const db = client.db("nikochan");

  const collection = db.collection("playRecord");

  await collection.updateMany(
    {
      lvHash: lvHashBefore,
    },
    {
      $set: {
        lvHash: lvHashAfter,
      },
    },
  );
} finally {
  await client.close();
}
