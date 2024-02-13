
import { UnauthorizedError } from '../errors/api-errors';
import tokenService from '../services/token.service';

export default function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(new UnauthorizedError());
        }

        const accessToken = authorizationHeader.split(' ')[1];
        if (!accessToken) {
            return next(new UnauthorizedError());
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(new UnauthorizedError());
        }

        req.user = userData;
        next();
    } catch (error) {
        return next(new UnauthorizedError());
    }
}