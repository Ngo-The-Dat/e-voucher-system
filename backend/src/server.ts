import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())

app.listen(PORT, () => {
    console.log(`Server is running: http://localhost:${PORT}`)
})