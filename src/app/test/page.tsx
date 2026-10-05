import { prisma } from "@/lib/prisma";

export default async function TestPage() {
  const voices = await prisma.voice.findMany();

  console.log(voices);

  return (
    <ul>
      {voices.map((voice, i) => {
        return (
          <li key={voice.id}>
            {i + 1}: {voice.name}
          </li>
        );
      })}
    </ul>
  );
}
