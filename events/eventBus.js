import { EventEmitter } from "node:events";

// Bus de eventos interno (un solo proceso). Se crea en el contenedor y se inyecta en los casos de uso.
export const createEventBus = () => new EventEmitter();

export default createEventBus;
