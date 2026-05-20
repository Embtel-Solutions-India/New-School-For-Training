let _io = null;

export const setIo = (io) => {
  _io = io;
};

export const getIo = () => _io;

export const emitToUsers = (userIds, event, data) => {
  if (!_io) return;
  for (const id of userIds) {
    _io.to(`user:${id.toString()}`).emit(event, data);
  }
};
