
import { ApiError } from '../errors/api-errors';
import tokenService from '../services/token.service';

export default function (error, req, res, next) {
    if (error instanceof ApiError) {
        return res.status(error.status).json({ message: error.message })
    }
}