import * as glob from "glob";

export const listProfiles = () => {
  return glob.readdirSync('./memory/passwords-ext/**/uid.json', {});
}


``
