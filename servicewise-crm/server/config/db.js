import {
  access,
  mkdir,
  writeFile,
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

const currentFile =
  fileURLToPath(import.meta.url);

const currentDirectory =
  path.dirname(currentFile);

export const dataDirectory =
  path.resolve(
    currentDirectory,
    "../data",
  );

export const ticketsFile =
  path.join(
    dataDirectory,
    "tickets.json",
  );

export const usersFile =
  path.join(
    dataDirectory,
    "users.json",
  );

export async function connectDataStore() {
  await mkdir(
    dataDirectory,
    {
      recursive: true,
    },
  );

  try {
    await access(ticketsFile);
  } catch {
    await writeFile(
      ticketsFile,
      "[]",
      "utf8",
    );
  }

  try {
    await access(usersFile);
  } catch {
    await writeFile(
      usersFile,
      JSON.stringify(
        {
          users: [],
          _updated:
            new Date().toISOString(),
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  console.log(
    `Data store ready: ${ticketsFile}`,
  );
}
