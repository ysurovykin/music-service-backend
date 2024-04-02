export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
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

    constructor() {
        super('User is not authorized', 401);
        this.status = 401;
    }
}

export class ValidationError extends ApiError {
    status: number;

    constructor(message: string) {
        super(message, 400);
        this.status = 400;
    }
}
