const axios = require('axios');
let isFirst = true;

function generateSearchResults (stores) {
    return stores.map(store => {
        return `
          <a href="/store/${store.slug}" class="search__result">
            <strong>${store.name}</strong>
          </a>
        `;
    }).join('');
}

function typeAhead(search) {
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');
  searchInput.on('input',function(){
    // If there is no value hide searchResults and stop
    if (!this.value) {
      searchResults.style.display = 'none';
    }
    searchResults.style.display = 'block';
    searchResults.innerHTML = '';
    axios.get(`/api/search/?q=${this.value}`)
    .then(res => {
        if (res.data.length) {
          searchResults.innerHTML = generateSearchResults(res.data);
        }
    })
  });
  searchInput.on('keyup', (e) => {
      const activeClass = 'search__result--active';
      let currentActive = document.querySelector(`.${activeClass}`);
      const results = document.querySelectorAll('.search__result');
      let next;
      
    if (![38,40,13].includes(e.keyCode)) {
        return;
    }

    if (e.keyCode===40 && currentActive) {
        next = currentActive.nextElementSibling || results[0];
    } else if (e.keyCode===40) {
        next = results[0];
    } else if (e.keyCode===38 && currentActive) {
        next = currentActive.previousElementSibling || results[results.length-1];
    } else if (e.keyCode===38) {
        next = results[results.length-1];
    } else if (e.keyCode === 13 && current.href) {
       window.location.href = current.href;
       return;
    }
    if (currentActive) {
        currentActive.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
})
};

export default typeAhead;