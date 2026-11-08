// Adapted from Exiled Exchange 2 (MIT) — see NOTICE

/** Default Client.txt locations per platform (GGG standalone + Steam). */
export function defaultLogPaths(platform: NodeJS.Platform, home: string): string[] {
  const j = (...p: string[]) => [home.replace(/[\\/]+$/, ""), ...p].join("/");
  switch (platform) {
    case "win32":
      return [
        "C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile 2\\logs\\Client.txt",
        "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\Client.txt",
        "C:\\Program Files\\Grinding Gear Games\\Path of Exile 2\\logs\\Client.txt",
        "C:\\Program Files\\Steam\\steamapps\\common\\Path of Exile 2\\logs\\Client.txt",
      ];
    case "linux":
      return [
        j(".wine/drive_c/Program Files (x86)/Grinding Gear Games/Path of Exile 2/logs/Client.txt"),
        j(".local/share/Steam/steamapps/common/Path of Exile 2/logs/Client.txt"),
      ];
    case "darwin":
      return [j("Library/Caches/com.GGG.PathOfExile/Logs/Client.txt")];
    default:
      return [];
  }
}
