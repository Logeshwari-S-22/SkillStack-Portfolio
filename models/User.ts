import { Schema, model, Document } from 'mongoose';

// Interface for the User document
interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

// User schema definition
const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on every save
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// User model
const User = model<IUser>('User', userSchema);

export default User;
export { IUser };