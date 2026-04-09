import API from "./api";
import { NoteRequest } from "../types/api.types";

/**
 * NoteService provides API functions for managing user notes in the TrueLens platform.
 * Handles CRUD operations for notes, including creation, retrieval, updates, deletion,
 * and search functionality. All operations are authenticated and user-scoped.
 */
export const getNotes = () => API.get("/notes");

/**
 * Creates a new note for the authenticated user.
 * @param data NoteRequest containing title, content, optional category and tags
 * @returns Promise with API response
 */
export const createNote = (data: NoteRequest) => {
  return API.post("/notes", data);
};

/**
 * Retrieves a specific note by ID.
 * @param id Note ID string
 * @returns Promise with note details
 */
export const getNoteById = (id: string) => API.get(`/notes/${id}`);

/**
 * Updates an existing note with new data.
 * @param id Note ID to update
 * @param data Partial note data to update
 * @returns Promise with update response
 */
export const updateNote = (id: string, data: Partial<NoteRequest>) =>
  API.put(`/notes/${id}`, data);

/**
 * Deletes a note permanently.
 * @param id Note ID to delete
 * @returns Promise with delete response
 */
export const deleteNote = (id: string) => API.delete(`/notes/${id}`);

/**
 * Searches notes by keyword in title or content.
 * @param keyword Search term
 * @returns Promise with matching notes
 */
export const searchNotes = (keyword: string) =>
  API.get(`/notes/search?keyword=${keyword}`);
