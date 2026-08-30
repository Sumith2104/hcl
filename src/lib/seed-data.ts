/**
 * Seed data for quiz_question and flashcard tables in FluxBase.
 *
 * Quiz questions: 40 across JavaScript/TypeScript, React, Python,
 *   Data Structures, System Design, General CS.
 * Flashcards: 36 across JavaScript, React, Python, CSS,
 *   Data Structures, General CS.
 */

// ==================== RAW QUIZ DATA (40 questions) ====================

const QUIZ_DATA: {
  category: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: string
}[] = [
  // ==================== JavaScript/TypeScript (7) ====================
  {
    category: 'JavaScript/TypeScript',
    question: 'What is the difference between let, const, and var in JavaScript?',
    options: [
      'var is function-scoped, let and const are block-scoped',
      'There is no difference',
      'let is block-scoped, var and const are function-scoped',
      'const can be reassigned, let cannot',
    ],
    correctAnswer: 0,
    explanation: 'var is function-scoped and hoisted. let and const are block-scoped. const cannot be reassigned after declaration.',
    difficulty: 'easy',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What is a closure in JavaScript?',
    options: [
      'A way to close browser windows',
      'A function that has access to its outer scope even after the outer function has returned',
      'A method to end a loop',
      'A type of error handling',
    ],
    correctAnswer: 1,
    explanation: 'A closure is formed when a function retains access to variables from its lexical scope, even after the parent function has finished executing.',
    difficulty: 'medium',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What is the event loop in JavaScript?',
    options: [
      'A for loop that runs indefinitely',
      'A mechanism that handles asynchronous callbacks using a call stack and task queue',
      'A debugging tool for events',
      'A type of design pattern',
    ],
    correctAnswer: 1,
    explanation: 'The event loop continuously checks the call stack and task queue, pushing callbacks from the queue to the stack when it is empty, enabling asynchronous behavior.',
    difficulty: 'medium',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What is the difference between == and === in JavaScript?',
    options: [
      '== compares values only, === compares types only',
      '== performs type coercion, === does not',
      'They are identical',
      '=== is deprecated in modern JavaScript',
    ],
    correctAnswer: 1,
    explanation: '== performs type coercion before comparison (e.g., "5" == 5 is true), while === requires both type and value to match ("5" === 5 is false).',
    difficulty: 'easy',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What are Promises and how do they work?',
    options: [
      'Guarantees made by developers',
      'Objects representing the eventual completion or failure of an async operation',
      'A synchronous programming pattern',
      'A type of variable declaration',
    ],
    correctAnswer: 1,
    explanation: 'A Promise is an object that represents the eventual result of an async operation. It can be in pending, fulfilled, or rejected state, and supports .then(), .catch(), and .finally() chains.',
    difficulty: 'medium',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What is prototypal inheritance in JavaScript?',
    options: [
      'Classes inherit from each other using the class keyword',
      'Objects inherit directly from other objects via an internal prototype link',
      'A feature only available in TypeScript',
      'A method to copy properties between objects',
    ],
    correctAnswer: 1,
    explanation: 'JavaScript uses prototypal inheritance where objects can inherit properties and methods directly from other objects through the prototype chain, rather than classical class-based inheritance.',
    difficulty: 'hard',
  },
  {
    category: 'JavaScript/TypeScript',
    question: 'What advantages does TypeScript provide over JavaScript?',
    options: [
      'Faster runtime execution speed',
      'Static type checking, better IDE support, and improved code maintainability',
      'Access to more browser APIs',
      'Smaller bundle sizes',
    ],
    correctAnswer: 1,
    explanation: 'TypeScript adds static typing to JavaScript, enabling compile-time error detection, better tooling/autocomplete, self-documenting code, and safer refactoring.',
    difficulty: 'easy',
  },

  // ==================== React (7) ====================
  {
    category: 'React',
    question: 'What is the purpose of the `key` prop in React lists?',
    options: [
      'To style list items differently',
      'To help React identify which items have changed',
      'To set the order of elements',
      'To bind event handlers to items',
    ],
    correctAnswer: 1,
    explanation: 'Keys help React identify which items in a list have changed, been added, or been removed, enabling efficient DOM reconciliation.',
    difficulty: 'easy',
  },
  {
    category: 'React',
    question: 'What does the `useMemo` hook optimize in React?',
    options: [
      'DOM re-renders',
      'Expensive calculations between renders',
      'Event listener cleanup',
      'State synchronization',
    ],
    correctAnswer: 1,
    explanation: 'useMemo memoizes the result of an expensive computation and only recalculates when its dependencies change, preventing unnecessary work on re-renders.',
    difficulty: 'medium',
  },
  {
    category: 'React',
    question: 'What is the difference between state and props in React?',
    options: [
      'State is read-only, props can be modified',
      'Props are passed from parent to child and are read-only; state is managed within a component',
      'There is no difference',
      'Props are for class components, state is for function components',
    ],
    correctAnswer: 1,
    explanation: 'Props are external data passed down from parent components and are immutable. State is internal data managed by the component itself using useState or useReducer.',
    difficulty: 'easy',
  },
  {
    category: 'React',
    question: 'What are React hooks and why were they introduced?',
    options: [
      'CSS hooks for styling components',
      'Functions that let you use state and lifecycle features in function components',
      'A replacement for Redux',
      'Event handlers for user interactions',
    ],
    correctAnswer: 1,
    explanation: 'Hooks were introduced in React 16.8 to let function components use state (useState), side effects (useEffect), and other React features without writing classes.',
    difficulty: 'medium',
  },
  {
    category: 'React',
    question: 'What is the virtual DOM and how does React use it?',
    options: [
      'A backup of the real DOM stored on disk',
      'A lightweight JS representation of the real DOM that React uses to minimize actual DOM updates',
      'A browser API for faster rendering',
      'A separate browser window for testing',
    ],
    correctAnswer: 1,
    explanation: 'React creates a virtual DOM tree in memory, computes the diff between old and new states (reconciliation), and batch-updates only changed nodes to the real DOM.',
    difficulty: 'medium',
  },
  {
    category: 'React',
    question: 'What is JSX and how does it work under the hood?',
    options: [
      'A new programming language',
      'A syntax extension that compiles to React.createElement() calls',
      'A template engine like Handlebars',
      'A CSS preprocessor',
    ],
    correctAnswer: 1,
    explanation: 'JSX is syntactic sugar for React.createElement(type, props, ...children). Babel or TypeScript compiles JSX into these function calls at build time.',
    difficulty: 'easy',
  },
  {
    category: 'React',
    question: 'What are React Server Components (RSC)?',
    options: [
      'Components that only run on the server and never hydrate',
      'Components that render on the server with zero client-side JS, and can directly access databases',
      'A replacement for API routes',
      'Components that use server-sent events',
    ],
    correctAnswer: 1,
    explanation: 'Server Components render on the server with zero client-side JS. They can directly access databases and files but cannot use hooks like useState or useEffect.',
    difficulty: 'hard',
  },

  // ==================== Python (7) ====================
  {
    category: 'Python',
    question: 'What does SQL stand for?',
    options: [
      'Structured Query Language',
      'Simple Query Language',
      'Standard Query Logic',
      'Sequential Query Language',
    ],
    correctAnswer: 0,
    explanation: 'SQL stands for Structured Query Language. It is the standard language for managing and querying relational databases.',
    difficulty: 'easy',
  },
  {
    category: 'Python',
    question: 'What is a pandas DataFrame in Python?',
    options: [
      'A 1D array',
      'A 2D labeled data structure',
      'A database connection object',
      'A visualization library',
    ],
    correctAnswer: 1,
    explanation: 'A pandas DataFrame is a 2D labeled data structure with columns of potentially different types, similar to a spreadsheet or SQL table.',
    difficulty: 'easy',
  },
  {
    category: 'Python',
    question: 'What is the difference between a list and a tuple in Python?',
    options: [
      'Lists are faster than tuples',
      'Lists are mutable, tuples are immutable',
      'Tuples can only hold numbers',
      'There is no difference',
    ],
    correctAnswer: 1,
    explanation: 'Lists are mutable (can be modified after creation) while tuples are immutable (cannot be changed). Tuples are slightly faster and can be used as dictionary keys.',
    difficulty: 'easy',
  },
  {
    category: 'Python',
    question: 'What are Python decorators and how do they work?',
    options: [
      'Functions that modify the appearance of output',
      'Functions that wrap another function to extend its behavior without modifying it',
      'A design pattern for database connections',
      'Syntax for CSS styling in Python',
    ],
    correctAnswer: 1,
    explanation: 'Decorators are higher-order functions that take a function and return a new function, commonly used with @syntax for logging, authentication, caching, and timing.',
    difficulty: 'medium',
  },
  {
    category: 'Python',
    question: 'What is a generator in Python?',
    options: [
      'A function that generates random numbers',
      'A function that uses yield to produce a sequence of values lazily',
      'A class that creates objects',
      'A module for code generation',
    ],
    correctAnswer: 1,
    explanation: 'A generator is a function that uses the yield keyword to return values one at a time, producing items lazily and being memory-efficient for large sequences.',
    difficulty: 'medium',
  },
  {
    category: 'Python',
    question: 'What is the GIL (Global Interpreter Lock) in Python?',
    options: [
      'A security feature preventing code injection',
      'A mutex that allows only one thread to execute Python bytecode at a time',
      'A locking mechanism for database operations',
      'A feature of the Python package manager',
    ],
    correctAnswer: 1,
    explanation: 'The GIL is a mutex in CPython that protects access to Python objects, preventing multiple threads from executing Python bytecodes simultaneously. It limits true parallelism but simplifies memory management.',
    difficulty: 'hard',
  },
  {
    category: 'Python',
    question: 'What are Python list comprehensions?',
    options: [
      'A way to understand lists better',
      'A concise syntax for creating lists from existing iterables',
      'A debugging tool for list operations',
      'A method to sort lists',
    ],
    correctAnswer: 1,
    explanation: 'List comprehensions provide a concise way to create lists using a single line of code: [expression for item in iterable if condition].',
    difficulty: 'easy',
  },

  // ==================== Data Structures (6) ====================
  {
    category: 'Data Structures',
    question: 'Which measure of central tendency is most resistant to outliers?',
    options: [
      'Mean',
      'Median',
      'Mode',
      'Range',
    ],
    correctAnswer: 1,
    explanation: 'The median is the middle value when data is sorted. Unlike the mean, it is not affected by extreme values, making it more resistant to outliers.',
    difficulty: 'medium',
  },
  {
    category: 'Data Structures',
    question: 'What is the difference between correlation and causation?',
    options: [
      'They are the same thing',
      'Correlation implies one variable causes another',
      'Correlation measures association; causation means one directly affects the other',
      'Causation is weaker than correlation',
    ],
    correctAnswer: 2,
    explanation: 'Correlation indicates a statistical relationship between variables. Causation means one variable directly influences another. Correlation does not imply causation.',
    difficulty: 'medium',
  },
  {
    category: 'Data Structures',
    question: 'What is the time complexity of binary search?',
    options: [
      'O(n)',
      'O(log n)',
      'O(n log n)',
      'O(1)',
    ],
    correctAnswer: 1,
    explanation: 'Binary search halves the search space with each comparison, giving O(log n) time complexity. It requires a sorted array and random access.',
    difficulty: 'easy',
  },
  {
    category: 'Data Structures',
    question: 'What is a hash map and how does it handle collisions?',
    options: [
      'A sorted array of key-value pairs',
      'A data structure using hash functions with collision resolution via chaining or open addressing',
      'A type of binary tree',
      'A linked list with hash values',
    ],
    correctAnswer: 1,
    explanation: 'A hash map uses a hash function to compute an index into an array of buckets. Collisions are resolved by chaining (linked lists at each bucket) or open addressing (probing for the next empty slot).',
    difficulty: 'medium',
  },
  {
    category: 'Data Structures',
    question: 'What is the difference between an array and a linked list?',
    options: [
      'They are identical in implementation',
      'Arrays have O(1) random access but O(n) insert/delete; linked lists have O(n) access but O(1) insert/delete at head',
      'Linked lists are always faster',
      'Arrays cannot store objects',
    ],
    correctAnswer: 1,
    explanation: 'Arrays provide O(1) index access with contiguous memory but require shifting for insertions/deletions. Linked lists allow O(1) insertion/deletion at known positions but require O(n) traversal for access.',
    difficulty: 'easy',
  },
  {
    category: 'Data Structures',
    question: 'What is a B-tree and why is it used in databases?',
    options: [
      'A tree that only stores boolean values',
      'A self-balancing tree with multiple keys per node, optimized for disk-based storage',
      'A binary tree with at most 2 children per node',
      'A tree used exclusively for in-memory operations',
    ],
    correctAnswer: 1,
    explanation: 'A B-tree is a self-balancing tree where each node can have multiple keys and children. It keeps data sorted and minimizes disk I/O by matching node sizes to disk block sizes.',
    difficulty: 'hard',
  },

  // ==================== System Design (7) ====================
  {
    category: 'System Design',
    question: 'What is the primary benefit of database connection pooling?',
    options: [
      'Encrypts database queries',
      'Reduces overhead of creating new connections',
      'Automatically backs up data',
      'Scales database storage',
    ],
    correctAnswer: 1,
    explanation: 'Connection pooling maintains a set of reusable connections, eliminating the overhead of establishing new connections for each request, improving performance and resource utilization.',
    difficulty: 'medium',
  },
  {
    category: 'System Design',
    question: 'What is the CAP theorem about in distributed systems?',
    options: [
      'Caching, Availability, Performance',
      'Consistency, Availability, Partition tolerance',
      'Concurrency, Atomicity, Persistence',
      'Containerization, Automation, Provisioning',
    ],
    correctAnswer: 1,
    explanation: 'The CAP theorem states a distributed system can provide at most 2 of 3: Consistency, Availability, and Partition tolerance. Since partitions are inevitable, systems choose between CP and AP.',
    difficulty: 'hard',
  },
  {
    category: 'System Design',
    question: 'What is a load balancer used for?',
    options: [
      'To encrypt network traffic',
      'To distribute incoming traffic across multiple servers',
      'To compress response data',
      'To store user sessions',
    ],
    correctAnswer: 1,
    explanation: 'A load balancer distributes incoming requests across multiple servers to improve availability, reliability, and performance by preventing any single server from being overwhelmed.',
    difficulty: 'easy',
  },
  {
    category: 'System Design',
    question: 'What is the main advantage of microservices over monolithic architecture?',
    options: [
      'Faster initial development',
      'Independent deployment and scaling of services',
      'Simpler debugging',
      'Lower infrastructure costs',
    ],
    correctAnswer: 1,
    explanation: 'Microservices allow each service to be developed, deployed, and scaled independently, enabling teams to work in parallel and choose the best technology for each service.',
    difficulty: 'medium',
  },
  {
    category: 'System Design',
    question: 'What is eventual consistency in distributed databases?',
    options: [
      'All reads always return the latest write',
      'Data is guaranteed to be consistent within milliseconds',
      'Given enough time, all replicas converge to the same state',
      'Only one replica can be written to at a time',
    ],
    correctAnswer: 2,
    explanation: 'Eventual consistency means that while reads may not immediately reflect the latest write, all replicas will converge to the same state given sufficient time without new writes.',
    difficulty: 'hard',
  },
  {
    category: 'System Design',
    question: 'What is a CDN (Content Delivery Network)?',
    options: [
      'A database management system',
      'A distributed network of servers to deliver content closer to users',
      'A security firewall',
      'A load testing tool',
    ],
    correctAnswer: 1,
    explanation: 'A CDN caches content at edge servers geographically close to users, reducing latency, origin server load, and improving availability through distributed delivery.',
    difficulty: 'easy',
  },
  {
    category: 'System Design',
    question: 'What is the purpose of a message queue in system design?',
    options: [
      'To store permanent data',
      'To enable asynchronous communication between services',
      'To replace databases',
      'To encrypt messages',
    ],
    correctAnswer: 1,
    explanation: 'Message queues enable asynchronous, decoupled communication between services. Producers send messages to the queue, and consumers process them at their own pace, improving resilience and scalability.',
    difficulty: 'medium',
  },

  // ==================== General CS (6) ====================
  {
    category: 'General CS',
    question: 'What HTTP status code indicates a resource was successfully created?',
    options: [
      '200 OK',
      '201 Created',
      '204 No Content',
      '301 Moved Permanently',
    ],
    correctAnswer: 1,
    explanation: 'HTTP 201 Created indicates that the request has been fulfilled and a new resource has been created as a result. It is typically returned for POST requests.',
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'In REST API design, which HTTP method is idempotent?',
    options: [
      'POST',
      'PATCH',
      'PUT',
      'CONNECT',
    ],
    correctAnswer: 2,
    explanation: 'PUT is idempotent — making the same PUT request multiple times produces the same result. POST is not idempotent as it may create multiple resources. PATCH may or may not be idempotent.',
    difficulty: 'medium',
  },
  {
    category: 'General CS',
    question: 'What does JWT stand for in authentication contexts?',
    options: [
      'JavaScript Web Token',
      'JSON Web Token',
      'Java Web Transport',
      'JSON Web Transmission',
    ],
    correctAnswer: 1,
    explanation: 'JWT (JSON Web Token) is a compact, URL-safe token format for securely transmitting information between parties. It consists of a header, payload, and signature separated by dots.',
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'What is overfitting in machine learning?',
    options: [
      'Model performs well on both training and test data',
      'Model memorizes training data but fails on new data',
      'Model is too simple to capture patterns',
      'Model takes too long to train',
    ],
    correctAnswer: 1,
    explanation: 'Overfitting occurs when a model learns the training data too well, including noise and outliers, resulting in poor generalization to unseen data. Techniques like regularization and cross-validation help prevent it.',
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'Which algorithm is used for classification tasks?',
    options: [
      'Linear Regression',
      'K-Means Clustering',
      'Support Vector Machine',
      'Principal Component Analysis',
    ],
    correctAnswer: 2,
    explanation: 'SVM (Support Vector Machine) is a supervised learning algorithm used for classification. It finds the optimal hyperplane that separates classes with the maximum margin.',
    difficulty: 'medium',
  },
  {
    category: 'General CS',
    question: 'What does CI/CD stand for?',
    options: [
      'Code Integration / Code Deployment',
      'Continuous Integration / Continuous Delivery',
      'Cloud Infrastructure / Container Delivery',
      'Centralized Integration / Centralized Deployment',
    ],
    correctAnswer: 1,
    explanation: 'CI/CD stands for Continuous Integration (automatically merging and testing code changes) and Continuous Delivery/Deployment (automating the release process to production).',
    difficulty: 'easy',
  },
]

// ==================== RAW FLASHCARD DATA (36 cards) ====================

const FLASHCARD_DATA: {
  category: string
  question: string
  answer: string
  difficulty: string
}[] = [
  // ==================== React (6) ====================
  {
    category: 'React',
    question: 'What is the virtual DOM in React and how does it improve performance?',
    answer: 'The virtual DOM is a lightweight JavaScript representation of the real DOM. React creates a VDOM tree, computes the diff between old and new states (reconciliation), and batch-updates only the changed nodes to the real DOM, minimizing expensive reflows and repaints.',
    difficulty: 'medium',
  },
  {
    category: 'React',
    question: 'Explain the difference between useEffect and useLayoutEffect.',
    answer: 'useEffect runs asynchronously after the browser paints, making it non-blocking. useLayoutEffect fires synchronously after all DOM mutations but before the browser paints — use it when you need to measure DOM elements or prevent visual flicker.',
    difficulty: 'medium',
  },
  {
    category: 'React',
    question: 'How does React Fiber architecture work?',
    answer: 'React Fiber is the reimplementation of the reconciliation algorithm. It introduces incremental rendering — work can be split into chunks and paused/resumed. It uses a linked-list tree structure (fiber nodes) with child, sibling, and return pointers, enabling priority-based scheduling and concurrent features.',
    difficulty: 'hard',
  },
  {
    category: 'React',
    question: 'What are React Server Components and when should you use them?',
    answer: 'Server Components render on the server with zero client-side JS. They can directly access databases and files. Use them for data-fetching components, heavy dependencies, and static content. They cannot use hooks like useState or useEffect — those belong in Client Components.',
    difficulty: 'hard',
  },
  {
    category: 'React',
    question: 'What is React.memo and when should you use it?',
    answer: 'React.memo is a HOC that memoizes a component, preventing re-renders if props have not changed (shallow comparison). Use it for pure presentational components that receive complex props and render frequently. Avoid premature optimization — use React DevTools Profiler to identify bottlenecks first.',
    difficulty: 'easy',
  },
  {
    category: 'React',
    question: 'Explain the useRef hook and its common use cases.',
    answer: 'useRef returns a mutable ref object that persists across renders without causing re-renders when mutated. Common uses: (1) Accessing DOM elements directly, (2) Storing mutable values like timers/intervals, (3) Keeping track of previous state values without triggering re-renders.',
    difficulty: 'easy',
  },

  // ==================== JavaScript (6) ====================
  {
    category: 'JavaScript',
    question: 'What is the difference between "interface" and "type" in TypeScript?',
    answer: 'Interfaces support declaration merging and extending, making them ideal for defining object shapes that may be augmented. Types are more flexible — they support unions, intersections, mapped types, conditionals, and tuple types. Use interfaces for public APIs, types for everything else.',
    difficulty: 'easy',
  },
  {
    category: 'JavaScript',
    question: 'Explain generics in TypeScript with a practical example.',
    answer: 'Generics allow creating reusable components that work with multiple types while maintaining type safety. Example: function identity<T>(arg: T): T { return arg } — the type T is inferred at call site. They enable type-safe collections, API response typing, and utility functions without code duplication.',
    difficulty: 'medium',
  },
  {
    category: 'JavaScript',
    question: 'What are conditional types and the "infer" keyword?',
    answer: 'Conditional types select one of two types based on a condition: T extends U ? X : Y. The "infer" keyword declares a type variable to be inferred within the conditional branch. Example: type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never — extracts function return type.',
    difficulty: 'hard',
  },
  {
    category: 'JavaScript',
    question: 'What is the "satisfies" operator in TypeScript?',
    answer: 'The "satisfies" operator (TypeScript 4.9+) validates that an expression matches a type without widening it. Unlike type annotations, "satisfies" preserves the literal types and unions of the original value while ensuring it conforms to the target type shape.',
    difficulty: 'medium',
  },
  {
    category: 'JavaScript',
    question: 'Explain the "keyof" and "typeof" type operators.',
    answer: '"keyof" creates a union type of all property keys of a type: keyof { name: string; age: number } = "name" | "age". "typeof" captures the type of a value at the type level: const obj = { a: 1 }; type ObjType = typeof obj. Combined: keyof typeof obj for runtime values.',
    difficulty: 'easy',
  },
  {
    category: 'JavaScript',
    question: 'What are mapped types and template literal types?',
    answer: 'Mapped types transform existing types: type Readonly<T> = { readonly [K in keyof T]: T[K] }. Template literal types (TS 4.1+) create string literal types using template syntax: type EventName = `on${Capitalize<string>}`. Combined: they enable powerful string-based type transformations.',
    difficulty: 'hard',
  },

  // ==================== CSS (6) ====================
  {
    category: 'CSS',
    question: 'Explain CSS specificity and the cascade order.',
    answer: 'Specificity determines which CSS rule applies when multiple rules target the same element. Order (lowest to highest): element selectors (0,0,1), class/attr/pseudo-class (0,1,0), ID selectors (1,0,0), inline styles, !important. Same specificity: last-defined wins. The cascade also considers @layer order, importance, and origin.',
    difficulty: 'easy',
  },
  {
    category: 'CSS',
    question: 'How does CSS Grid differ from Flexbox?',
    answer: 'Flexbox is one-dimensional (row or column), ideal for navbars, card rows, and inline layouts. CSS Grid is two-dimensional (rows AND columns), perfect for page layouts, dashboards, and complex grid structures. Use Flexbox for component internals, Grid for page-level layout. They work together.',
    difficulty: 'easy',
  },
  {
    category: 'CSS',
    question: 'What are CSS custom properties (variables) and why use them?',
    answer: 'CSS custom properties (--var-name) are reusable values defined with :root or any selector. Unlike preprocessor variables, they cascade, can be changed at runtime via JS, respond to media queries, and participate in inheritance. They power theming systems, design tokens, and dynamic styling.',
    difficulty: 'medium',
  },
  {
    category: 'CSS',
    question: 'Explain the CSS containment property.',
    answer: 'CSS containment (contain: layout | paint | size | style | inline-size) isolates a subtree from the rest of the document. "layout" prevents internal layout from affecting outside. "paint" creates a new stacking context and containing block. "size" fixes the element dimensions. Essential for performance optimization.',
    difficulty: 'hard',
  },
  {
    category: 'CSS',
    question: 'What is the difference between position: absolute and fixed?',
    answer: 'Both remove elements from normal flow. "absolute" positions relative to the nearest positioned ancestor (or the viewport if none). "fixed" positions relative to the viewport and stays in place during scrolling. "sticky" is a hybrid — behaves like relative until a scroll threshold is reached, then becomes fixed.',
    difficulty: 'easy',
  },
  {
    category: 'CSS',
    question: 'How do CSS subgrid and container queries work?',
    answer: 'Subgrid (grid-template-columns/rows: subgrid) lets a child adopt its parent grid tracks, enabling nested items to align across levels. Container queries (@container) apply styles based on an ancestor container size instead of the viewport — essential for truly responsive component design.',
    difficulty: 'hard',
  },

  // ==================== Data Structures (6) ====================
  {
    category: 'Data Structures',
    question: 'What is the difference between a stack and a queue?',
    answer: 'Stack: LIFO (Last In, First Out) — push/pop from top. Use cases: undo/redo, call stack, expression evaluation, DFS. Queue: FIFO (First In, First Out) — enqueue at back, dequeue from front. Use cases: BFS, task scheduling, message queues, print jobs.',
    difficulty: 'easy',
  },
  {
    category: 'Data Structures',
    question: 'Explain the time complexity of common hash table operations.',
    answer: 'Average case: O(1) for search, insert, delete — direct index access via hash function. Worst case: O(n) when all keys hash to the same bucket (collision). Good hash functions distribute keys uniformly. Load factor (n/buckets) affects performance — typically resize at 0.75.',
    difficulty: 'medium',
  },
  {
    category: 'Data Structures',
    question: 'What is a B-tree and why is it used in databases?',
    answer: 'A B-tree is a self-balancing tree where each node can have multiple keys and children. It keeps data sorted and allows searches, insertions, and deletions in O(log n). Databases use B-trees (and B+ trees) because they minimize disk I/O — large nodes match disk block sizes, reducing the number of disk reads.',
    difficulty: 'hard',
  },
  {
    category: 'Data Structures',
    question: 'What is the difference between an array and a linked list?',
    answer: 'Array: contiguous memory, O(1) random access by index, O(n) insert/delete (shifting). Linked List: non-contiguous nodes with pointers, O(n) access (traversal), O(1) insert/delete at head. Arrays have better cache locality. Use arrays for read-heavy workloads, linked lists for frequent insertions/deletions.',
    difficulty: 'easy',
  },
  {
    category: 'Data Structures',
    question: 'Explain a Trie (prefix tree) and its use cases.',
    answer: 'A Trie is a tree where each node represents a character. Words are stored as paths from root to marked end nodes. Search/insert: O(m) where m is word length (not number of words). Use cases: autocomplete, spell check, IP routing, T9 predictive text. Space tradeoff: stores characters, not words.',
    difficulty: 'medium',
  },
  {
    category: 'Data Structures',
    question: 'What is a heap and how is it implemented?',
    answer: 'A heap is a complete binary tree satisfying the heap property: max-heap (parent ≥ children) or min-heap (parent ≤ children). Implemented as an array: for index i, left child = 2i+1, right = 2i+2, parent = (i-1)/2. Insert O(log n) (bubble up), extract-min/max O(log n) (bubble down). Used in priority queues and heapsort.',
    difficulty: 'hard',
  },

  // ==================== General CS (6) ====================
  {
    category: 'General CS',
    question: 'What is the CAP theorem and how does it apply to distributed systems?',
    answer: 'CAP states a distributed system can provide at most 2 of 3 guarantees: Consistency (all nodes see same data), Availability (every request gets a response), Partition tolerance (system works despite network splits). Since network partitions are inevitable, real systems choose between CP (e.g., etcd) and AP (e.g., Cassandra).',
    difficulty: 'medium',
  },
  {
    category: 'General CS',
    question: 'Explain the difference between SQL and NoSQL databases.',
    answer: 'SQL (relational): structured schema, ACID transactions, complex joins, vertical scaling. NoSQL: flexible schema, eventual consistency, horizontal scaling, specialized for access patterns (document: MongoDB, key-value: Redis, wide-column: Cassandra, graph: Neo4j). Choose based on data structure, query complexity, and scaling needs.',
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'What is a load balancer and what are common load balancing algorithms?',
    answer: 'A load balancer distributes incoming requests across multiple servers to improve availability, reliability, and performance. Algorithms: Round Robin (sequential), Least Connections (to least busy), IP Hash (session affinity), Weighted Round Robin (by server capacity), Least Response Time (fastest server first).',
    difficulty: 'medium',
  },
  {
    category: 'General CS',
    question: 'Explain Big O notation with common time complexities.',
    answer: "Big O describes the upper bound of an algorithm's growth rate as input size increases. Common: O(1) constant, O(log n) logarithmic (binary search), O(n) linear, O(n log n) linearithmic (merge sort), O(n²) quadratic (bubble sort), O(2ⁿ) exponential (subset generation). Focus on the dominant term and drop constants.",
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'How does binary search work and what are its requirements?',
    answer: 'Binary search finds a target in O(log n) by repeatedly halving the search space. Requirements: sorted array, random access. Process: compare middle element with target, if equal return index, if target < middle search left half, else search right half. Implement iteratively or recursively with low/high pointers.',
    difficulty: 'easy',
  },
  {
    category: 'General CS',
    question: 'Compare merge sort and quick sort.',
    answer: 'Merge sort: guaranteed O(n log n), stable, requires O(n) extra space, divide-then-merge. Quick sort: average O(n log n) worst O(n²), in-place (O(log n) stack), not stable, divide around pivot. Merge sort preferred for linked lists and stability requirements. Quick sort preferred for arrays with good pivot selection.',
    difficulty: 'medium',
  },

  // ==================== Python (6) ====================
  {
    category: 'Python',
    question: 'How does a CDN work and what are its benefits?',
    answer: 'A Content Delivery Network caches content at edge servers geographically close to users. When a user requests content, the CDN routes to the nearest edge server, reducing latency. Benefits: faster load times, reduced origin server load, DDoS mitigation, improved availability, and SSL/TLS offloading.',
    difficulty: 'easy',
  },
  {
    category: 'Python',
    question: 'Explain microservices vs monolithic architecture trade-offs.',
    answer: 'Monolith: simpler development, easier debugging, single deployment, but harder to scale individual parts. Microservices: independent deployment, technology diversity, team autonomy, but add complexity (network calls, distributed transactions, observability, data consistency). Start monolith, extract services as needed.',
    difficulty: 'medium',
  },
  {
    category: 'Python',
    question: 'What is eventual consistency and how is it achieved?',
    answer: 'Eventual consistency means all replicas will converge to the same state given enough time without new writes. Achieved via: gossip protocols, anti-entropy (Merkle trees), read repair, hinted handoff, vector clocks for conflict detection. CRDTs and event sourcing are common implementation patterns.',
    difficulty: 'hard',
  },
  {
    category: 'Python',
    question: 'Explain dynamic programming and when to apply it.',
    answer: 'Dynamic programming solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation. Two approaches: top-down (memoization on recursion) and bottom-up (tabulation). Apply when: optimal substructure exists and overlapping subproblems are present. Classic examples: Fibonacci, knapsack, LCS, edit distance.',
    difficulty: 'medium',
  },
  {
    category: 'Python',
    question: 'What is a graph traversal and compare BFS vs DFS?',
    answer: 'Graph traversal visits all reachable nodes. BFS uses a queue, explores level by level — O(V+E), finds shortest path in unweighted graphs. DFS uses a stack (or recursion), explores depth-first — O(V+E), useful for cycle detection, topological sort, connected components, and maze solving.',
    difficulty: 'easy',
  },
  {
    category: 'Python',
    question: "Explain Dijkstra's algorithm and its limitations.",
    answer: "Dijkstra's finds the shortest path from a source to all nodes in a weighted graph with non-negative edges. Uses a min-priority queue: O((V+E) log V). Process: extract min-distance node, relax all edges, repeat. Limitations: cannot handle negative weights (use Bellman-Ford instead), doesn't track paths without modification.",
    difficulty: 'hard',
  },
]

// ==================== SEED FUNCTIONS ====================

/**
 * Seed 40 quiz questions into the quiz_question table.
 * Uses batch INSERT for efficiency. Skips if table already has data.
 */
export async function seedQuizQuestions(fb: any) {
  // Check if table already has data
  const rows = await fb.fluxbase.query(
    'SELECT COUNT(*) as cnt FROM quiz_question'
  )
  const count = Number(rows[0]?.cnt ?? 0)
  if (count > 0) {
    console.log(`[seed] quiz_question already has ${count} rows, skipping.`)
    return
  }

  console.log(`[seed] Seeding ${QUIZ_DATA.length} quiz questions...`)

  // Build batch INSERT values
  const valueClauses = QUIZ_DATA.map((q) => {
    const id = fb.qid()
    const cat = fb.escapeSql(q.category)
    const question = fb.escapeSql(q.question)
    const options = fb.escapeSql(JSON.stringify(q.options))
    const correct = q.correctAnswer
    const explanation = fb.escapeSql(q.explanation)
    const difficulty = fb.escapeSql(q.difficulty)
    return `(${id}, '${cat}', '${question}', '${options}', ${correct}, '${explanation}', '${difficulty}', CURRENT_TIMESTAMP)`
  })

  const sql = `INSERT INTO quiz_question (id, category, question, options, correct_answer, explanation, difficulty, created_at) VALUES
  ${valueClauses.join(',\n  ')}`

  await fb.fluxbase.run(sql)
  console.log(`[seed] Seeded ${QUIZ_DATA.length} quiz questions.`)
}

/**
 * Seed 36 flashcards into the flashcard table.
 * Uses batch INSERT for efficiency. Skips if table already has data.
 */
export async function seedFlashcards(fb: any) {
  // Check if table already has data
  const rows = await fb.fluxbase.query(
    'SELECT COUNT(*) as cnt FROM flashcard'
  )
  const count = Number(rows[0]?.cnt ?? 0)
  if (count > 0) {
    console.log(`[seed] flashcard already has ${count} rows, skipping.`)
    return
  }

  console.log(`[seed] Seeding ${FLASHCARD_DATA.length} flashcards...`)

  // Build batch INSERT values — split into batches of 12 for safety
  const BATCH_SIZE = 12
  for (let i = 0; i < FLASHCARD_DATA.length; i += BATCH_SIZE) {
    const batch = FLASHCARD_DATA.slice(i, i + BATCH_SIZE)

    const valueClauses = batch.map((fc) => {
      const id = fb.qid()
      const cat = fb.escapeSql(fc.category)
      const question = fb.escapeSql(fc.question)
      const answer = fb.escapeSql(fc.answer)
      const difficulty = fb.escapeSql(fc.difficulty)
      return `(${id}, '${cat}', '${question}', '${answer}', '${difficulty}', CURRENT_TIMESTAMP)`
    })

    const sql = `INSERT INTO flashcard (id, category, question, answer, difficulty, created_at) VALUES
  ${valueClauses.join(',\n  ')}`

    await fb.fluxbase.run(sql)
  }

  console.log(`[seed] Seeded ${FLASHCARD_DATA.length} flashcards.`)
}

/**
 * Seed both quiz questions and flashcards if the tables are empty.
 * Convenience function that calls both seed functions.
 */
export async function seedAllIfEmpty(fb: any) {
  await seedQuizQuestions(fb)
  await seedFlashcards(fb)
}
