<script setup>
  import { RouterView } from 'vue-router'
  import "bootstrap"
</script>

<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <Suspense>
        <!-- main content -->
        <component :is="Component"></component>

        <!-- loading state -->
        <template #fallback> Loading... </template>
      </Suspense>
    </template>
  </RouterView>
</template>

<style>
  @import "bootstrap/dist/css/bootstrap.min.css";
</style>