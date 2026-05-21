/**
 * clean_verification_db.ts
 *
 * One-time migration: re-evaluates isVerified for every user using the
 * canonical formula:
 *   isVerified = (emailVerified && isInstitutionalEmail) || idVerificationStatus === 'verified'
 *
 * Users that currently have isVerified:true but don't meet the criteria
 * are demoted to isVerified:false.
 *
 * Run with:
 *   npx ts-node src/scripts/clean_verification_db.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quads';

function isInstitutionalEmail(email?: string): boolean {
  if (!email) return false;
  return /@(student\.)?umat\.edu\.gh$/i.test(email) || /@st\.umat\.edu\.gh$/i.test(email);
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const allUsers = await User.find({});
    console.log(`\n📋  Total users in DB: ${allUsers.length}`);

    let demotedCount = 0;
    let alreadyCorrectCount = 0;
    let promotedCount = 0;

    for (const user of allUsers) {
      const shouldBeVerified =
        (user.emailVerified && isInstitutionalEmail(user.email)) ||
        user.idVerificationStatus === 'verified';

      if (user.isVerified === shouldBeVerified) {
        alreadyCorrectCount++;
        continue;
      }

      const action = shouldBeVerified ? 'PROMOTE' : 'DEMOTE';
      console.log(
        `  [${action}] ${user.name} <${user.email}>` +
        ` | emailVerified=${user.emailVerified}` +
        ` | isInstitutional=${isInstitutionalEmail(user.email)}` +
        ` | idVerificationStatus=${user.idVerificationStatus ?? 'none'}` +
        ` | isVerified: ${user.isVerified} → ${shouldBeVerified}`
      );

      await User.findByIdAndUpdate(user._id, { $set: { isVerified: shouldBeVerified } });

      if (shouldBeVerified) promotedCount++;
      else demotedCount++;
    }

    console.log('\n─────────────────────────────────');
    console.log(`✅  Already correct:  ${alreadyCorrectCount}`);
    console.log(`🔻  Demoted (false):  ${demotedCount}`);
    console.log(`🔺  Promoted (true):  ${promotedCount}`);
    console.log('─────────────────────────────────');
    console.log('Migration complete.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌  Error during migration:', error);
    process.exit(1);
  }
}

run();
