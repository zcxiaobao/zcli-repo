import log from "npmlog";

log.heading = "zctools";

log.addLevel("success", 2000, { fg: "green", bold: true });

export default log;
