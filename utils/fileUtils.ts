// utils/fileUtils.ts
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:application/pdf;base64,JVBERi0xLjQKJ..."
      // we need to remove the "data:[mime];base64," part
      resolve(result.split(',')[1]);
    };
    reader.onerror = error => reject(error);
  });
};
