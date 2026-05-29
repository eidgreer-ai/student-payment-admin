import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/todo.dart';
import '../database/todo_database_helper.dart';

class TodoProvider extends ChangeNotifier {
  final List<Todo> _todos = [];
  bool _isLoading = false;
  String _filterType = 'all'; // all, active, completed, overdue, today
  String _selectedCategory = 'الكل';
  String _sortBy = 'priority'; // priority, dueDate, created
  String _searchQuery = '';

  List<Todo> get todos => _filterAndSortTodos();
  bool get isLoading => _isLoading;
  String get filterType => _filterType;
  String get selectedCategory => _selectedCategory;
  String get sortBy => _sortBy;

  TodoProvider() {
    loadTodos();
  }

  Future<void> loadTodos() async {
    _isLoading = true;
    notifyListeners();
    try {
      final loadedTodos = await TodoDatabaseHelper.instance.getAllTodos();
      _todos.clear();
      _todos.addAll(loadedTodos);
    } catch (e) {
      print('Error loading todos: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  List<Todo> _filterAndSortTodos() {
    List<Todo> filtered = List.from(_todos);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((todo) =>
              todo.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (todo.description?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false))
          .toList();
    }

    // Apply category filter
    if (_selectedCategory != 'الكل') {
      filtered = filtered.where((todo) => todo.category == _selectedCategory).toList();
    }

    // Apply status filter
    switch (_filterType) {
      case 'active':
        filtered = filtered.where((todo) => !todo.isCompleted).toList();
        break;
      case 'completed':
        filtered = filtered.where((todo) => todo.isCompleted).toList();
        break;
      case 'overdue':
        filtered = filtered.where((todo) => todo.isOverdue).toList();
        break;
      case 'today':
        filtered = filtered.where((todo) => todo.isDueToday).toList();
        break;
    }

    // Apply sorting
    switch (_sortBy) {
      case 'dueDate':
        filtered.sort((a, b) {
          if (a.dueDate == null) return 1;
          if (b.dueDate == null) return -1;
          return a.dueDate!.compareTo(b.dueDate!);
        });
        break;
      case 'created':
        filtered.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'priority':
      default:
        filtered.sort((a, b) => b.priorityValue.compareTo(a.priorityValue));
    }

    return filtered;
  }

  Future<void> addTodo(
    String title, {
    String? description,
    DateTime? dueDate,
    String priority = 'medium',
    String category = 'عام',
  }) async {
    final todo = Todo(
      id: const Uuid().v4(),
      title: title,
      description: description,
      dueDate: dueDate,
      priority: priority,
      category: category,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await TodoDatabaseHelper.instance.createTodo(todo);
    _todos.add(todo);
    notifyListeners();
  }

  Future<void> updateTodo(
    String id, {
    String? title,
    String? description,
    DateTime? dueDate,
    String? priority,
    String? category,
  }) async {
    final index = _todos.indexWhere((todo) => todo.id == id);
    if (index != -1) {
      final updatedTodo = _todos[index].copyWith(
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        category: category,
        updatedAt: DateTime.now(),
      );

      await TodoDatabaseHelper.instance.updateTodo(updatedTodo);
      _todos[index] = updatedTodo;
      notifyListeners();
    }
  }

  Future<void> toggleTodoCompletion(String id) async {
    final index = _todos.indexWhere((todo) => todo.id == id);
    if (index != -1) {
      final todo = _todos[index];
      final updatedTodo = todo.copyWith(
        isCompleted: !todo.isCompleted,
        updatedAt: DateTime.now(),
      );

      await TodoDatabaseHelper.instance.updateTodo(updatedTodo);
      _todos[index] = updatedTodo;
      notifyListeners();
    }
  }

  Future<void> deleteTodo(String id) async {
    await TodoDatabaseHelper.instance.deleteTodo(id);
    _todos.removeWhere((todo) => todo.id == id);
    notifyListeners();
  }

  Future<void> deleteCompletedTodos() async {
    await TodoDatabaseHelper.instance.deleteCompletedTodos();
    _todos.removeWhere((todo) => todo.isCompleted);
    notifyListeners();
  }

  void setFilterType(String filterType) {
    _filterType = filterType;
    notifyListeners();
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSortBy(String sortBy) {
    _sortBy = sortBy;
    notifyListeners();
  }

  void search(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<List<String>> getCategories() async {
    final stats = await TodoDatabaseHelper.instance.getCategoryStatistics();
    final categories = ['الكل', ...stats.keys.toList()];
    return categories;
  }

  Future<Map<String, int>> getStatistics() async {
    return await TodoDatabaseHelper.instance.getTodoStatistics();
  }

  Future<Map<String, dynamic>> exportTodos() async {
    return await TodoDatabaseHelper.instance.getFullBackup();
  }

  Future<void> importTodos(Map<String, dynamic> backup) async {
    await TodoDatabaseHelper.instance.restoreFromBackup(backup);
    await loadTodos();
  }
}
