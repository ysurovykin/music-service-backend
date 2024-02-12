import ListenerModel, { ListenerInfoResponseDataType, ListenerSongDataToUpdateType, RepeatSongStateEnum } from '../models/listener.model';
import { NotFoundError } from '../errors/api-errors';
import ListenerDto from '../dtos/listener.dto';

class ListenerService {

    async getListenerById(listenerId: string): Promise<ListenerInfoResponseDataType> {
        const listener = await ListenerModel.findOne({_id: listenerId}).lean();
        if (!listener) {
            throw new NotFoundError(`Listener with id ${listenerId} not found`);
        }

        const listenerDto = new ListenerDto(listener);
        return {
            ...listenerDto
        };
    }

    async updateSongPlayerData(listenerId: string, songData: ListenerSongDataToUpdateType): Promise<void> {
        await ListenerModel.updateOne({_id: listenerId, ...songData});
    }

    async savePlayTime(listenerId: string, playTime: number): Promise<void> {
        await ListenerModel.updateOne({_id: listenerId, playTime});
    }

    async changeVolume(listenerId: string, volume: number): Promise<void> {
        console.log('changevalume')
        await ListenerModel.updateOne({_id: listenerId, volume});
    }

    async changeMuting(listenerId: string, muted: boolean): Promise<void> {
        await ListenerModel.updateOne({_id: listenerId, muted});
    }

    async changeShuffleState(listenerId: string, shuffleEnabled: boolean): Promise<void> {
        await ListenerModel.updateOne({_id: listenerId, shuffleEnabled});
    }

    async changeRepeatSongState(listenerId: string, repeatSongState: RepeatSongStateEnum): Promise<void> {
        await ListenerModel.updateOne({_id: listenerId, repeatSongState});
    }

}

const listenerService = new ListenerService();
export default listenerService;