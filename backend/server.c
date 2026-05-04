#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define AURA_PORT 8080
#define REQUEST_SIZE 4096

static volatile sig_atomic_t running = 1;

static void handle_signal(int signal_number) {
    (void)signal_number;
    running = 0;
}

static void send_response(int client_fd, const char *status, const char *content_type, const char *body) {
    char response[2048];
    int body_length = (int)strlen(body);
    int response_length = snprintf(
        response,
        sizeof(response),
        "HTTP/1.1 %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %d\r\n"
        "Connection: close\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "\r\n"
        "%s",
        status,
        content_type,
        body_length,
        body
    );

    if (response_length > 0) {
        send(client_fd, response, (size_t)response_length, 0);
    }
}

static void route_request(int client_fd, const char *request) {
    char method[16] = {0};
    char path[256] = {0};

    /* The scaffold only reads the request line: METHOD PATH HTTP/VERSION. */
    if (sscanf(request, "%15s %255s", method, path) != 2) {
        send_response(client_fd, "400 Bad Request", "application/json", "{\"error\":\"Bad request\"}\n");
        return;
    }

    if (strcmp(method, "GET") != 0) {
        send_response(client_fd, "405 Method Not Allowed", "application/json", "{\"error\":\"Method not allowed\"}\n");
        return;
    }

    if (strcmp(path, "/health") == 0) {
        send_response(client_fd, "200 OK", "application/json", "{\"status\":\"healthy\",\"service\":\"aura-backend\"}\n");
        return;
    }

    if (strcmp(path, "/version") == 0) {
        send_response(client_fd, "200 OK", "application/json", "{\"name\":\"aura-backend\",\"version\":\"0.1.0\"}\n");
        return;
    }

    send_response(client_fd, "404 Not Found", "application/json", "{\"error\":\"Not found\"}\n");
}

static int create_server_socket(void) {
    int server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        perror("socket");
        return -1;
    }

    int reuse = 1;
    /* Let the dev server restart quickly after Ctrl-C without waiting on the port. */
    if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse)) < 0) {
        perror("setsockopt");
        close(server_fd);
        return -1;
    }

    struct sockaddr_in address;
    memset(&address, 0, sizeof(address));
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_ANY);
    address.sin_port = htons(AURA_PORT);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("bind");
        close(server_fd);
        return -1;
    }

    if (listen(server_fd, 16) < 0) {
        perror("listen");
        close(server_fd);
        return -1;
    }

    return server_fd;
}

int main(void) {
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    int server_fd = create_server_socket();
    if (server_fd < 0) {
        return EXIT_FAILURE;
    }

    printf("Aura backend listening on http://localhost:%d\n", AURA_PORT);
    printf("Try GET /health or GET /version\n");

    while (running) {
        struct sockaddr_in client_address;
        socklen_t client_length = sizeof(client_address);
        /* Handle one short HTTP request per accepted connection. */
        int client_fd = accept(server_fd, (struct sockaddr *)&client_address, &client_length);

        if (client_fd < 0) {
            if (errno == EINTR) {
                continue;
            }
            perror("accept");
            break;
        }

        char request[REQUEST_SIZE] = {0};
        ssize_t bytes_read = recv(client_fd, request, sizeof(request) - 1, 0);

        if (bytes_read > 0) {
            request[bytes_read] = '\0';
            route_request(client_fd, request);
        }

        close(client_fd);
    }

    close(server_fd);
    printf("\nAura backend stopped.\n");
    return EXIT_SUCCESS;
}
