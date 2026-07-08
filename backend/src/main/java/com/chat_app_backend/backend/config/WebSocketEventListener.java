package com.chat_app_backend.backend.config;

import com.chat_app_backend.backend.repository.RoomRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Listens to WebSocket connect/disconnect events.
 * Tracks which session belongs to which room,
 * and deletes a room from MongoDB when it has no members left.
 */
@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);

    private final RoomRepository roomRepository;

    // sessionId → roomId
    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();

    // roomId → Set of active sessionIds
    private final Map<String, Set<String>> roomMemberMap = new ConcurrentHashMap<>();

    public WebSocketEventListener(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    /**
     * Fired when a client subscribes to a STOMP topic.
     * We track subscriptions to /topic/room/{roomId}.
     */
    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();

        if (destination != null && destination.startsWith("/topic/room/")) {
            String roomId = destination.substring("/topic/room/".length());
            sessionRoomMap.put(sessionId, roomId);
            roomMemberMap
                    .computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet())
                    .add(sessionId);
            log.info("Session {} joined room '{}'. Active members: {}",
                    sessionId, roomId, roomMemberMap.get(roomId).size());
        }
    }

    /**
     * Fired when a client's WebSocket connection is closed
     * (browser tab closed, "Leave Room" button pressed, network drop, etc.).
     * If the room has no remaining members, it is deleted from MongoDB.
     */
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        String roomId = sessionRoomMap.remove(sessionId);
        if (roomId == null) return; // session was never tracked (e.g., did not subscribe)

        Set<String> members = roomMemberMap.get(roomId);
        if (members != null) {
            members.remove(sessionId);
            int remaining = members.size();
            log.info("Session {} left room '{}'. Remaining members: {}", sessionId, roomId, remaining);

            if (remaining == 0) {
                roomMemberMap.remove(roomId);
                roomRepository.deleteByRoomId(roomId);
                log.info("Room '{}' deleted — no members remaining.", roomId);
            }
        }
    }
}
