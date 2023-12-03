// src/components/MessageContent.js
import React from 'react';

function MessageContent() {
  return (
    <div>
      <header>
        <h1>Welcome to KingKing Island</h1>
      </header>

      <section>
        <h2>About Me</h2>
        <p>
          Hello, I'm Jin. This is my GitHub page.<br />
          I write code for fun and for work. <br />
          <br />
          This page may sometimes mess up, like life, <br />
          but I'm learning how to fix it. <br />
          <br />
          So stay tuned for more updates!
        </p>
      </section>

      <footer>
        <h2>Contact</h2>
        <p>
          Connect with me on LinkedIn:
          <a href="https://www.linkedin.com/in/jin1206t/" target="_blank" rel="noopener noreferrer">
            My LinkedIn Profile
          </a>
        </p>
      </footer>
    </div>
  );
}

export default MessageContent;
