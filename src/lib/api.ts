import axios from "axios";

const API_KEY = "d5b6cacdee5ceb38161e26a0777dc4d1";
const API_URL = "https://api.scripture.api.bible/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: { "api-key": API_KEY },
});

export async function fetchBibleBooks() {
  try {
    const response = await api.get("/bibles/de4e12af7f28f599-02/books");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching Bible books:", error);
    return [];
  }
}

export async function fetchChapters(bookId: string): Promise<number[]> {
  try {
    const response = await api.get(
      `/bibles/de4e12af7f28f599-02/books/${bookId}/chapters`
    );
    return response.data.data.map((chapter: { number: string }) =>
      parseInt(chapter.number)
    );
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }
}

export async function fetchChapterContent(
  bookId: string,
  chapterNumber: number
) {
  try {
    const response = await api.get(
      `/bibles/de4e12af7f28f599-02/chapters/${bookId}.${chapterNumber}`
    );
    return response.data.data.content;
  } catch (error) {
    console.error("Error fetching chapter content:", error);
    return "";
  }
}

export async function fetchSearchResults(query: string) {
  try {
    const response = await api.get("/bibles/de4e12af7f28f599-02/search", {
      params: { query },
    });
    return response.data.data.verses;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return [];
  }
}
