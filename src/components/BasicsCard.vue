<script setup>
const items = [
  { title: 'Linux', img: '/img/linux.png', url: 'https://www.linux.org' },
  { title: 'MySQL', img: '/img/mysql.png', url: 'https://www.mysql.com' },
  { title: 'VUE', img: '/img/vue.png', url: 'https://vuejs.org' },
  { title: 'Node.js', img: '/img/nodejs.png', url: 'https://nodejs.org' },
  { title: 'Shell', img: '/img/shell.png', url: '#' }, // # 表示不跳转
  { title: 'Python', img: '/img/python.png', url: 'https://www.python.org' },
    { title: 'Docker', img: '/img/docker.png', url: 'https://www.docker.com' },
    { title: 'ITIL', img: '/public/img/people.png', url: 'https://support.freshservice.com' },
]

// 跳转函数
const openLink = (url) => {
  if (url && url !== '#') {
    window.open(url, '_blank') // 在新标签页打开
  }
}
</script>

<template>
  <div class="glass-card basics-card">
    <section class="gallery-grid">
      <article 
        class="gallery-item" 
        v-for="item in items" 
        :key="item.title"
        @click="openLink(item.url)" 
      >
        <div class="image-wrapper">
          <img :src="item.img" :alt="item.title">
        </div>
        <h3 class="item-title">{{ item.title }}</h3>
      </article>
    </section>
  </div>
</template>

<style scoped>
/* 可选：给可点击的项加一个 cursor 样式，虽然全局已有 pointer，但这里加强一下 */
.gallery-item {
  cursor: pointer;
}
</style>