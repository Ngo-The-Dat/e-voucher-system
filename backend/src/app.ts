import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import apiRouter from './routers/index.js';
import type { ErrorRequestHandler } from 'express';

const app = express();

app.set('trust proxy', 'loopback');
app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/api/partner/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.' },
}));
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'JSON không hợp lệ.' });
    return;
  }
  if ((err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({ message: 'Nội dung yêu cầu quá lớn.' });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Lỗi hệ thống.' });
};

app.use(handleError);

export default app;
