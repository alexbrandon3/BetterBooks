import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error("❌ JWT_SECRET not found in environment variables.");
  process.exit(1);
} else {
  console.log(`✅ JWT_SECRET found: ${secret}`);
}

// Sample Payload
const payload = { userId: 123, role: "admin" };

try {
  // Sign a Token
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  console.log(`✅ Token successfully signed: ${token}`);

  // Verify the Token
  const decoded = jwt.verify(token, secret);
  console.log(`✅ Token successfully verified:`, decoded);
} catch (err) {
  if (err instanceof Error) {
    console.error("❌ Error during JWT signing or verification:", err.message);
  } else {
    console.error("❌ Unknown error during JWT processing.");
  }
}
