export class ApiError extends Error {
    status: number;
    details: Object;

    constructor(message: string, status: number, details?: Object) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

export class NotFoundError extends ApiError {
    status: number;

    constructor(message: string) {
        super(message, 404);
        this.status = 404;
    }
}

export class ForbiddenError extends ApiError {
    status: number;

    constructor(message: string) {
        super(message, 403);
        this.status = 403;
    }
}

export class UnauthorizedError extends ApiError {
    status: number;
    details: Object;

    constructor(message: string = 'User is not authorized', details?: Object) {
        super(message, 401, details);
        this.status = 401;
        this.details = details;
    }
}

export class ValidationError extends ApiError {
    status: number;

    constructor(message: string) {
        super(message, 400);
        this.status = 400;
    }
}
