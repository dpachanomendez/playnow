import mongoose from "mongoose"

export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://playnow25:eZ0Ro2d6IJrPCQeK@cluster0.xcjlpfh.mongodb.net/registro");
    console.log("MongoDB esta conectado");
  } catch (error) {
    console.error(error);
  }
};