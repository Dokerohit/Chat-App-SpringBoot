package com.chat_app_backend.backend.repository;

import com.chat_app_backend.backend.entity.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {
    Room findByRoomId(String roomId);
    void deleteByRoomId(String roomId);
}
