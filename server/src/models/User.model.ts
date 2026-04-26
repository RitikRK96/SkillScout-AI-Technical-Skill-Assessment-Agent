import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String }, // hashed, optional if using OAuth later
    name: { type: String, required: true },
    avatar: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", UserSchema);
