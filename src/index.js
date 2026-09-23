import { Container } from "@cloudflare/containers";
import { handleRequest } from "./request.js";

export class Subconverter extends Container {
  defaultPort = 25500;
  sleepAfter = "10m";
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
