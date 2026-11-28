"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Boxes, ChevronDown, Layers, List, X } from "lucide-react";
import type { CollectionItem, CollectionMaterial, CollectionTopic } from "@/lib/collection";

type Section = "materials" | "items";
const itemImage = (item: CollectionItem) => "/collection/art/" + item.id;

function MaterialCard({ material, topicName, onItem }: {
  material: CollectionMaterial; topicName: string; onItem: (item: CollectionItem) => void;
}) {
  return <details className="material-card">
    <summary>
      <img className="material-preview" src={material.image} alt="" />
      <span className="material-heading">
        <span className="material-topic">{topicName}</span>
        <span className="material-name">{material.title}</span>
      </span>
      <span className="material-toggle"><ChevronDown size={19} aria-hidden="true" /></span>
    </summary>
    <div className="material-reading">
      <img src={material.image} alt={material.imageAlt} />
      {material.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
    </div>
    {material.items.length > 0 && <footer className="material-footer">
      <h3>Связанные предметы</h3>
      <ul>{material.items.map((item) => <li key={item.id}>
        <button type="button" aria-haspopup="dialog" onClick={() => onItem(item)}>
          <img src={itemImage(item)} alt="" loading="lazy" />{item.title}
        </button>
      </li>)}</ul>
    </footer>}
  </details>;
}

function TopicList({ topics, selected, onSelect }: {
  topics: CollectionTopic[]; selected: string; onSelect: (id: string) => void;
}) {
  return <ul className="collection-topics">
    {topics.map((topic) => <li key={topic.id}>
      <button type="button" aria-pressed={topic.id === selected} onClick={() => onSelect(topic.id)}>
        <span>{topic.title}</span><span className="topic-count" aria-label={`Количество материалов: ${topic.materials.length}`}>{topic.materials.length}</span>
      </button>
    </li>)}
  </ul>;
}

export function CollectionView({ topics }: { topics: CollectionTopic[] }) {
  const [section, setSection] = useState<Section>("materials");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [activeItem, setActiveItem] = useState<CollectionItem | null>(null);
  const itemDialog = useRef<HTMLDialogElement>(null);
  const topicDrawer = useRef<HTMLDialogElement>(null);
  const topic = topics.find((entry) => entry.id === topicId) ?? topics[0];
  const materials = topics.flatMap((entry) => entry.materials);
  const items = materials.flatMap((material) => material.items);
  const isMaterials = section === "materials";

  useEffect(() => {
    if (activeItem && !itemDialog.current?.open) itemDialog.current?.showModal();
  }, [activeItem]);

  function selectTopic(id: string) {
    setTopicId(id);
    topicDrawer.current?.close();
  }

  return <main className="collection-page">
    <h1>Коллекция</h1>
    <div className="collection-switch" role="group" aria-label="Раздел коллекции">
      <button type="button" aria-pressed={isMaterials} onClick={() => setSection("materials")}>
        <BookOpen size={19} aria-hidden="true" />Материалы<span>{materials.length}</span>
      </button>
      <button type="button" aria-pressed={!isMaterials} onClick={() => setSection("items")}>
        <Boxes size={19} aria-hidden="true" />Предметы<span>{items.length}</span>
      </button>
    </div>

    {!topic ? <section className="collection-empty" aria-live="polite">
      {isMaterials ? <BookOpen aria-hidden="true" /> : <Boxes aria-hidden="true" />}
      <h2>{isMaterials ? "Материалов пока нет" : "Предметов пока нет"}</h2>
      <p>{isMaterials ? "Здесь появятся методические материалы за пройденные приключения." : "Предметы появятся здесь вместе с открытыми методическими материалами."}</p>
    </section> : isMaterials ? <div className="collection-layout">
      <aside className="topic-sidebar" aria-label="Темы материалов">
        <h2><List size={18} aria-hidden="true" />Темы</h2>
        <TopicList topics={topics} selected={topic.id} onSelect={selectTopic} />
      </aside>
      <section className="collection-content" aria-labelledby="materials-title">
        <div className="collection-content-heading">
          <h2 id="materials-title">Методические материалы</h2>
          <button className="open-topics" type="button" aria-haspopup="dialog" onClick={() => topicDrawer.current?.showModal()}>
            <List size={17} aria-hidden="true" />Темы
          </button>
        </div>
        <div className="material-stack" key={topic.id}>
          {topic.materials.map((material) => <MaterialCard key={material.id} material={material} topicName={topic.title} onItem={setActiveItem} />)}
        </div>
      </section>
    </div> : <section aria-labelledby="items-title">
      <h2 id="items-title" className="items-title">Предметы коллекции</h2>
      {items.length ? <ul className="item-grid">{items.map((item) => <li key={item.id}>
        <button className="item-tile" type="button" aria-haspopup="dialog" onClick={() => setActiveItem(item)}>
          <span className="item-art"><img src={itemImage(item)} alt="" loading="lazy" /></span>
          <span>{item.title}</span>
        </button>
      </li>)}</ul> : <p>У открытых материалов пока нет предметов.</p>}
    </section>}

    <dialog className="collection-dialog item-dialog" ref={itemDialog} aria-labelledby="collection-item-title"
      onClose={() => setActiveItem(null)} onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}>
      <div className="item-sheet">
        <button type="button" className="dialog-close" aria-label="Закрыть карточку предмета" onClick={() => itemDialog.current?.close()}><X size={21} /></button>
        {activeItem && <>
          <div className="item-portrait"><img src={itemImage(activeItem)} alt={activeItem.title} /></div>
          <div className="item-copy"><h2 id="collection-item-title">{activeItem.title}</h2><p>{activeItem.description}</p></div>
        </>}
      </div>
    </dialog>
    <dialog className="collection-dialog topic-drawer" ref={topicDrawer} aria-labelledby="topic-drawer-title"
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="drawer-sheet">
        <div className="drawer-heading"><h2 id="topic-drawer-title"><Layers size={20} aria-hidden="true" />Темы</h2>
          <button type="button" className="dialog-close" aria-label="Закрыть список тем" onClick={() => topicDrawer.current?.close()}><X size={21} /></button>
        </div>
        <TopicList topics={topics} selected={topic?.id ?? ""} onSelect={selectTopic} />
      </div>
    </dialog>
  </main>;
}
