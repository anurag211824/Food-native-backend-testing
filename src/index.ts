import "dotenv/config"
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import router from './routes/index.js';
import cookieParser from "cookie-parser";

const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(cors({ origin: '*' }));
app.use(cookieParser());
app.use(express.json());

app.use('/api', router);
console.log("Router loaded");

app.get('/', (req: Request, res: Response) => {
  res.send('TypeScript Backend is running! 🚀');
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});




