from rest_framework.pagination import PageNumberPagination

class ParcellePagination(PageNumberPagination):
    page_size =100
    page_query_param ='page'
    page_size_query_param = "page_size"
    max_page_size = 500

class ExploitantPagination(PageNumberPagination):
    page_size = 10
    page_query_param = "page"
    page_size_query_param = "page_size"
    max_page_size = 100