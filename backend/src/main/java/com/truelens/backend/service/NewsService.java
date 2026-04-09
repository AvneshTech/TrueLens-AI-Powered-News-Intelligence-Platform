package com.truelens.backend.service;

import com.truelens.backend.dto.NewsArticle;
import com.truelens.backend.dto.NewsApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class NewsService {

    @Value("${news.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public List<NewsArticle> getNews(String category, String search, int page, int size) {

        String query = (search != null && !search.isEmpty())
                ? search
                : (category != null ? category : "india");

        String fromDate = java.time.LocalDate.now().minusDays(1).toString();

        String url = "https://newsapi.org/v2/everything?q=" + query +
                "&from=" + fromDate +
                "&sortBy=publishedAt" +
                "&page=" + (page + 1) +
                "&pageSize=" + size +
                "&apiKey=" + apiKey;

        System.out.println("Calling URL: " + url);

        NewsApiResponse response = restTemplate.getForObject(url, NewsApiResponse.class);

        if (response == null || response.getArticles() == null) {
            return List.of();
        }

        return response.getArticles().stream().map(a -> {
            NewsArticle article = new NewsArticle();

            article.setTitle(a.getTitle());
            article.setDescription(
                    a.getDescription() != null ? a.getDescription() : "No description");
            article.setUrl(a.getUrl());
            article.setImageUrl(
                    a.getUrlToImage() != null
                            ? a.getUrlToImage()
                            : "https://via.placeholder.com/300");
            article.setSource(
                    a.getSource() != null ? a.getSource().getName() : "Unknown");

            try {
                article.setPublishedAt(
                        OffsetDateTime.parse(a.getPublishedAt()).toLocalDateTime());
            } catch (Exception e) {
                article.setPublishedAt(LocalDateTime.now());
            }

            article.setCategory(
                    category != null ? category : "General");

            return article;
        }).toList();
    }
}