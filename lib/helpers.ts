export function createRandomDeviceName() {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase();

  if (userAgent.includes("ipad") || userAgent.includes("tablet")) {
    return "My Tablet";
  }

  if (userAgent.includes("iphone") || (userAgent.includes("android") && userAgent.includes("mobile"))) {
    return "My Phone";
  }

  if (userAgent.includes("windows") || userAgent.includes("mac") || userAgent.includes("linux")) {
    return "My Laptop";
  }

  return "My Device";
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        resolve(result);
        return;
      }

      reject(new Error("Unable to read file."));
    };

    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}