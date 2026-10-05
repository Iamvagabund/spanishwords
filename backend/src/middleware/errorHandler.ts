import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  }

  // body-parser errors (invalid JSON, payload too large)
  const status = (err as any).status ?? (err as any).statusCode
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return res.status(status).json({
      status: 'fail',
      message: status === 413 ? 'Request body too large' : 'Invalid request',
    })
  }
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: err.message })
  }

  console.error('ERROR', err.message)

  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong'
  })
} 