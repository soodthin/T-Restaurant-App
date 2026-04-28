from rest_framework import pagination


class ItemPaginator(pagination.PageNumberPagination):
    page_size = 12


class ReviewPaginator(pagination.PageNumberPagination):
    page_size = 5
