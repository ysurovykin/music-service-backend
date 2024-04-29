
import { ApiError } from '../errors/api-errors';
import tokenService from '../user/token/token.service';

export default function (error, req, res, next) {
    if (error instanceof ApiError) {
        return res.status(error.status).json({ message: error.message, details: error.details })
    } else if (!!error.message) {
        return res.status(500).json({ message: error.message });
    } else {
        return res.status(500).json({ message: 'An unknown error occurred while processing the request' });
    }
}