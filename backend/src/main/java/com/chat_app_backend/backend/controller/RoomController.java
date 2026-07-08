package com.chat_app_backend.backend.controller;


import com.chat_app_backend.backend.entity.Message;
import com.chat_app_backend.backend.entity.Room;
import com.chat_app_backend.backend.repository.RoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomController {
    RoomRepository roomRepository;
    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }


    //create room
    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody String roomId) {
        if(roomRepository.findByRoomId(roomId) != null){
            // room is already there
            return ResponseEntity.badRequest().body("Room already exists");
        }
        //create new room
        Room room = new Room();
        room.setRoomId(roomId);
        roomRepository.save(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    //get room:join
    @GetMapping("/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable String roomId) {
        if(roomRepository.findByRoomId(roomId) == null){
            return ResponseEntity.badRequest().body("Room does not exist");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(roomRepository.findByRoomId(roomId));

    }
    //get message of room
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<Message>> getMessages(@PathVariable String roomId,
                                                     @RequestParam(value = "page",defaultValue = "0",required = false)int page,
                                                     @RequestParam(value = "size",defaultValue = "20",required = false)int size
                                                     ){

            Room room = roomRepository.findByRoomId(roomId);
            if(room == null){
                return ResponseEntity.badRequest().build();
            }
            //get messages
            //pagination
        List<Message> messages = room.getMessages();

        int total = messages.size();
        int end = total - page * size;

        if (end <= 0) {
            return ResponseEntity.ok(List.of());
        }

        int start = Math.max(0, end - size);

        List<Message> paginatedMessages =
                messages.subList(start, end);

        return ResponseEntity.ok(paginatedMessages);
       }
}
