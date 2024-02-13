import ListenerModel, { ListenerInfoResponseDataType } from '../models/listener.model';
import { NotFoundError } from '../errors/api-errors';
import ListenerDto from '../dtos/listener.dto';

class ListenerService {

    async getListenerById(listenerId: string): Promise<ListenerInfoResponseDataType> {
        const listener = await ListenerModel.findOne({ _id: listenerId }).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        const listenerDto = new ListenerDto(listener);
        return {
            ...listenerDto
        };
    }

}

const listenerService = new ListenerService();
export default listenerService;