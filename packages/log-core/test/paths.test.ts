import { describe, expect, it } from "vitest";
import { defaultLogPaths } from "../src";

describe("defaultLogPaths", () => {
  it("per platform", () => {
    expect(defaultLogPaths("darwin", "/Users/a")).toEqual([
      "/Users/a/Library/Caches/com.GGG.PathOfExile/Logs/Client.txt",
    ]);
    expect(defaultLogPaths("linux", "/home/a/")[1]).toBe(
      "/home/a/.local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt",
    );
    expect(
      defaultLogPaths("win32", "C:\\Users\\a").every((p) => p.endsWith("logs\\Client.txt")),
    ).toBe(true);
    expect(defaultLogPaths("freebsd", "/x")).toEqual([]);
  });
});
