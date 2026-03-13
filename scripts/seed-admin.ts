import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
});

const users = [
  {
    name: 'Administrator',
    email: 'admin@academia.com',
    password: 'admin123456',
    role: 'ADMIN',
  },
  {
    name: 'Recepção',
    email: 'checkin@academia.com',
    password: 'checkin123456',
    role: 'CHECKIN',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/academia';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const AdminModel = mongoose.model('Admin', AdminSchema, 'admins');

  for (const user of users) {
    const existing = await AdminModel.findOne({ email: user.email });

    if (existing) {
      console.log(`[SKIP] ${user.role} already exists: ${user.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);
    await AdminModel.create({
      name: user.name,
      email: user.email,
      passwordHash,
      role: user.role,
    });

    console.log(`[OK] ${user.role} created: ${user.email} / ${user.password}`);
  }

  console.log('IMPORTANT: Change passwords after first login!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
